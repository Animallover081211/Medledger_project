import { PatientSidebar } from "../components/layout/patient_sidebar";

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-neutral-50">
            <PatientSidebar />
            <main className="flex-1 lg:ml-56 p-6 pt-24 lg:pt-8">
                {children}
            </main>
        </div>
    );
}
