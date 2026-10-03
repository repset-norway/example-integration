import { useState } from "react";
import type { IPatient } from "./api/models/patient";
import { PatientView } from "./patient-view";
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "./components/button";
import { Table, TableCell, TableRow } from "./components/table";
import { Card } from "./components/card";
import type { IUser } from "./auth/use-auth";
import { useQuery } from "@tanstack/react-query";
import { validateEmail } from "./utils/validate-email";

interface IPatientProps {
    user: IUser;
    checkAuth: () => unknown;
}

async function fetchPatients(): Promise<IPatient[]> {
    const response = await fetch("/api/patients");
    if (!response.ok) throw new Error("Failed to fetch patients");
    return response.json();
}

export const PatientList = (props: IPatientProps) => {
    const { data: patients, refetch } = useQuery({
        queryFn: fetchPatients,
        queryKey: ["patients"],
    });

    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const selectedPatient = patients?.find((p) => p.id === selectedPatientId) ?? null;

    const createPatient = async () => {
        const name = prompt("Name");
        if (!name) return;

        const email = prompt("Email");
        if (email && !validateEmail(email)) return alert("Must be empty or valid email");

        const res = await fetch("/api/patients", {
            method: "POST",
            body: JSON.stringify({ name, email }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) return alert("Failed to make patient");

        refetch();
    };

    const connectRepsetUser = async () => {
        const res = await fetch("/api/repset/init-link", { method: "POST" });
        const data = await res.json();
        window.location.assign(data.redirectUrl);
    };

    const removeRepsetUser = async () => {
        await fetch("/api/repset/delete-link", { method: "DELETE" });
        await props.checkAuth();
    };

    const isRepsetConnected = props.user.repsetUserId != null;

    return (
        <div>
            <Card className="mb-5 flex-col gap-5">
                <div className="text-center">
                    <p className="font-medium">Repset connection</p>
                    <p className="text-pretty text-gray-600">
                        {isRepsetConnected
                            ? "A Repset account has been connected."
                            : "Connect the system to Repset to gain access to training programs."}
                    </p>
                </div>
                {isRepsetConnected ? (
                    <Button variant="destructive" onClick={removeRepsetUser}>
                        Disconnect from Repset
                    </Button>
                ) : (
                    <Button onClick={connectRepsetUser}>Log in with Repset</Button>
                )}
            </Card>

            {selectedPatient ? (
                <div>
                    <Button className="mb-3 gap-1" variant="ghost" onClick={() => setSelectedPatientId(null)}>
                        <ArrowLeftIcon size={16} />
                        <span className="font-semibold text-[16px]">Back</span>
                    </Button>
                    <PatientView patient={selectedPatient} refetchPatients={refetch} />
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-5">
                        <p className="font-semibold text-xl">Patients</p>
                        <Button onClick={createPatient}>New patient</Button>
                    </div>

                    {patients?.length === 0 ? (
                        <Card>
                            <span className="text-gray-500 w-full text-center">No patients</span>
                        </Card>
                    ) : (
                        <Table columns={["Id", "Name", "E-mail", ""]}>
                            {patients?.map((p) => (
                                <TableRow key={p.id} onClick={() => setSelectedPatientId(p.id)}>
                                    <TableCell>{p.id}</TableCell>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>{p.email}</TableCell>
                                    <TableCell className="flex justify-end">
                                        <ChevronRightIcon />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </Table>
                    )}
                </div>
            )}
        </div>
    );
};
