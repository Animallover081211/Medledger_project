import { DoctorSidebar } from "../components/layout/doctor_sidebar";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-neutral-50">
            <DoctorSidebar />
            <main className="flex-1 lg:ml-56 p-6 pt-24 lg:pt-8">
                {children}
            </main>
        </div>
    );
}
