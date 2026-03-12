package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type Patient struct {
	DocType   string `json:"docType"`
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type Doctor struct {
	DocType   string `json:"docType"`
	ID        string `json:"id"`
	Name      string `json:"name"`
	Specialty string `json:"specialty"`
	CreatedAt string `json:"createdAt"`
}

type ConsentRecord struct {
	DocType   string `json:"docType"`
	PatientID string `json:"patientId"`
	DoctorID  string `json:"doctorId"`
	Status    string `json:"status"`
	GrantedAt string `json:"grantedAt"`
	RevokedAt string `json:"revokedAt,omitempty"`
}

type AuditLog struct {
	DocType   string `json:"docType"`
	ID        string `json:"id"`
	PatientID string `json:"patientId"`
	DoctorID  string `json:"doctorId"`
	Action    string `json:"action"`
	Allowed   bool   `json:"allowed"`
	Reason    string `json:"reason,omitempty"`
	Timestamp string `json:"timestamp"`
	TxID      string `json:"txId"`
}

func (s *SmartContract) RegisterPatient(ctx contractapi.TransactionContextInterface, patientId string, name string) error {
	key := patientKey(patientId)
	exists, err := getState[Patient](ctx, key)
	if err != nil {
		return err
	}
	if exists != nil {
		return fmt.Errorf("patient %s already exists", patientId)
	}

	patient := Patient{
		DocType:   "patient",
		ID:        patientId,
		Name:      name,
		CreatedAt: toISOString(ctx),
	}
	return putState(ctx, key, patient)
}

func (s *SmartContract) RegisterDoctor(ctx contractapi.TransactionContextInterface, doctorId string, name string, specialty string) error {
	key := doctorKey(doctorId)
	exists, err := getState[Doctor](ctx, key)
	if err != nil {
		return err
	}
	if exists != nil {
		return fmt.Errorf("doctor %s already exists", doctorId)
	}

	doctor := Doctor{
		DocType:   "doctor",
		ID:        doctorId,
		Name:      name,
		Specialty: specialty,
		CreatedAt: toISOString(ctx),
	}
	return putState(ctx, key, doctor)
}

func (s *SmartContract) GetPatient(ctx contractapi.TransactionContextInterface, patientId string) (*Patient, error) {
	key := patientKey(patientId)
	patient, err := getState[Patient](ctx, key)
	if err != nil {
		return nil, err
	}
	if patient == nil {
		return nil, fmt.Errorf("patient %s not found", patientId)
	}
	return patient, nil
}

func (s *SmartContract) GetDoctor(ctx contractapi.TransactionContextInterface, doctorId string) (*Doctor, error) {
	key := doctorKey(doctorId)
	doctor, err := getState[Doctor](ctx, key)
	if err != nil {
		return nil, err
	}
	if doctor == nil {
		return nil, fmt.Errorf("doctor %s not found", doctorId)
	}
	return doctor, nil
}

func (s *SmartContract) GrantConsent(ctx contractapi.TransactionContextInterface, patientId string, doctorId string) error {
	if err := assertPatientAndDoctorExist(ctx, patientId, doctorId); err != nil {
		return err
	}

	record := ConsentRecord{
		DocType:   "consent",
		PatientID: patientId,
		DoctorID:  doctorId,
		Status:    "GRANTED",
		GrantedAt: toISOString(ctx),
	}

	if err := writeAudit(ctx, AuditLog{
		PatientID: patientId,
		DoctorID:  doctorId,
		Action:    "GRANT",
		Allowed:   true,
		Reason:    "PATIENT_GRANTED_CONSENT",
	}); err != nil {
		return err
	}

	return putState(ctx, consentKey(patientId, doctorId), record)
}

func (s *SmartContract) RevokeConsent(ctx contractapi.TransactionContextInterface, patientId string, doctorId string) error {
	if err := assertPatientAndDoctorExist(ctx, patientId, doctorId); err != nil {
		return err
	}

	key := consentKey(patientId, doctorId)
	record, err := getState[ConsentRecord](ctx, key)
	if err != nil {
		return err
	}
	if record == nil {
		return fmt.Errorf("consent does not exist for patient %s and doctor %s", patientId, doctorId)
	}

	record.Status = "REVOKED"
	record.RevokedAt = toISOString(ctx)

	if err := writeAudit(ctx, AuditLog{
		PatientID: patientId,
		DoctorID:  doctorId,
		Action:    "REVOKE",
		Allowed:   false,
		Reason:    "PATIENT_REVOKED_CONSENT",
	}); err != nil {
		return err
	}

	return putState(ctx, key, record)
}

func (s *SmartContract) RequestAccess(ctx contractapi.TransactionContextInterface, patientId string, doctorId string) (bool, error) {
	if err := assertPatientAndDoctorExist(ctx, patientId, doctorId); err != nil {
		return false, err
	}

	consent, err := getState[ConsentRecord](ctx, consentKey(patientId, doctorId))
	if err != nil {
		return false, err
	}
	allowed := consent != nil && consent.Status == "GRANTED"

	if err := writeAudit(ctx, AuditLog{
		PatientID: patientId,
		DoctorID:  doctorId,
		Action:    "REQUEST",
		Allowed:   allowed,
		Reason:    reasonForRequest(allowed),
	}); err != nil {
		return false, err
	}

	return allowed, nil
}

func (s *SmartContract) EmergencyAccess(ctx contractapi.TransactionContextInterface, patientId string, doctorId string, reason string) (bool, error) {
	if err := assertPatientAndDoctorExist(ctx, patientId, doctorId); err != nil {
		return false, err
	}

	if err := writeAudit(ctx, AuditLog{
		PatientID: patientId,
		DoctorID:  doctorId,
		Action:    "EMERGENCY",
		Allowed:   true,
		Reason:    reason,
	}); err != nil {
		return false, err
	}

	return true, nil
}

func (s *SmartContract) GetAuditLog(ctx contractapi.TransactionContextInterface, patientId string) (string, error) {
	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey("audit", []string{patientId})
	if err != nil {
		return "", err
	}
	defer iterator.Close()

	var results []AuditLog
	for iterator.HasNext() {
		res, err := iterator.Next()
		if err != nil {
			return "", err
		}
		var record AuditLog
		if err := json.Unmarshal(res.Value, &record); err != nil {
			return "", err
		}
		results = append(results, record)
	}

	bytes, err := json.Marshal(results)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		panic(err.Error())
	}
	if err := chaincode.Start(); err != nil {
		panic(err.Error())
	}
}

func patientKey(patientId string) string {
	return "PATIENT:" + patientId
}

func doctorKey(doctorId string) string {
	return "DOCTOR:" + doctorId
}

func consentKey(patientId string, doctorId string) string {
	return "CONSENT:" + patientId + ":" + doctorId
}

func auditKey(ctx contractapi.TransactionContextInterface, patientId string, timestamp string) (string, error) {
	return ctx.GetStub().CreateCompositeKey("audit", []string{patientId, timestamp, ctx.GetStub().GetTxID()})
}

func toISOString(ctx contractapi.TransactionContextInterface) string {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return time.Now().UTC().Format(time.RFC3339Nano)
	}
	t := time.Unix(ts.Seconds, int64(ts.Nanos)).UTC()
	return t.Format(time.RFC3339Nano)
}

func writeAudit(ctx contractapi.TransactionContextInterface, entry AuditLog) error {
	timestamp := toISOString(ctx)
	key, err := auditKey(ctx, entry.PatientID, timestamp)
	if err != nil {
		return err
	}
	entry.DocType = "audit"
	entry.ID = key
	entry.Timestamp = timestamp
	entry.TxID = ctx.GetStub().GetTxID()

	return putState(ctx, key, entry)
}

func assertPatientAndDoctorExist(ctx contractapi.TransactionContextInterface, patientId string, doctorId string) error {
	patient, err := getState[Patient](ctx, patientKey(patientId))
	if err != nil {
		return err
	}
	if patient == nil {
		return fmt.Errorf("patient %s does not exist", patientId)
	}

	doctor, err := getState[Doctor](ctx, doctorKey(doctorId))
	if err != nil {
		return err
	}
	if doctor == nil {
		return fmt.Errorf("doctor %s does not exist", doctorId)
	}
	return nil
}

func reasonForRequest(allowed bool) string {
	if allowed {
		return "CONSENT_GRANTED"
	}
	return "CONSENT_MISSING_OR_REVOKED"
}

func putState[T any](ctx contractapi.TransactionContextInterface, key string, value T) error {
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	// Sort keys for deterministic JSON
	b, err = sortJSONKeys(b)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(key, b)
}

func getState[T any](ctx contractapi.TransactionContextInterface, key string) (*T, error) {
	data, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if data == nil || len(data) == 0 {
		return nil, nil
	}
	var out T
	if err := json.Unmarshal(data, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func sortJSONKeys(input []byte) ([]byte, error) {
	var m map[string]interface{}
	if err := json.Unmarshal(input, &m); err != nil {
		return nil, err
	}
	ordered := make(map[string]interface{}, len(m))
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		ordered[k] = m[k]
	}
	return json.Marshal(ordered)
}
