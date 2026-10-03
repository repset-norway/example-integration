import { MailIcon, PenLineIcon, PrinterIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import type { IPatient } from "./api/models/patient";
import { Button } from "./components/button";
import { Table, TableCell, TableRow } from "./components/table";
import { getInitials } from "./utils/get-initials";
import { relativeDate } from "./utils/relative-date";
import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import { Card } from "./components/card";
import { validateEmail } from "./utils/validate-email";
import { isRepsetIframeEvent } from "./utils/repset-iframe-event";
import clsx from "clsx";
import { useProgramActions } from "./use-program-actions";

interface IPatientViewProps {
    patient: IPatient;
    refetchPatients: () => unknown;
}

export const PatientView = (props: IPatientViewProps) => {
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const patient = props.patient;
    const programActions = useProgramActions(patient, props.refetchPatients);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!isRepsetIframeEvent(event.data)) return;

            // Using events sent from Repset in the iframe to close the editor in time
            if (event.data.command === "editor_closed") {
                setIframeUrl(null);
                props.refetchPatients();
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const updatePatient = async () => {
        const name = prompt("Name");
        if (!name) return;

        const email = prompt("Email");
        if (email && !validateEmail(email)) return alert("Must be empty or valid email");

        const res = await fetch(`/api/patients/${patient.id}`, {
            method: "PUT",
            body: JSON.stringify({ name, email }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) return alert("Failed to update patient");
        props.refetchPatients();
    };

    const deletePatient = async () => {
        const shouldDelete = confirm("Are you sure you want to delete the patient?");
        if (!shouldDelete) return;

        const res = await fetch(`/api/patients/${patient.id}`, { method: "delete" });

        if (!res.ok) return alert("Failed to delete patient");
        props.refetchPatients();
    };

    return (
        <div>
            {iframeUrl && (
                <div className="absolute inset-0 z-2">
                    <div className="relative size-full shadow-md bg-white">
                        <iframe src={iframeUrl} className="size-full" />
                    </div>
                </div>
            )}

            <div className="bg-white w-full shadow-sm rounded-lg p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="bg-[#d9eeef] rounded-full flex items-center justify-center size-12 font-bold text-lg tracking-wider font-mono text-[#1d2224]">
                        {getInitials(patient.name)}
                    </span>

                    <div>
                        <h1 className="font-semibold text-lg">{patient.name}</h1>
                        <h2 className="text-gray-600">{patient.email}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={updatePatient} variant="outline">
                        Edit
                    </Button>
                    <Button onClick={deletePatient} variant="destructive">
                      Delete
                    </Button>
                </div>
            </div>

            <div className="mt-10 flex justify-between items-center mb-4">
                <p className="font-semibold text-lg">Programmer</p>
                <Button
                    onClick={async () => {
                        const redirectUrl = await programActions.create();
                        if (redirectUrl) setIframeUrl(redirectUrl);
                    }}
                >
                    New program
                </Button>
            </div>

            {patient.programs.length === 0 ? (
                <Card>
                    <span className="text-gray-500 w-full text-center">No programs on patient</span>
                </Card>
            ) : (
                <Table columns={["Name", "Created", "Last changed", "Number of exercises", ""]}>
                    {patient.programs.map((p) => (
                        <TableRow key={p.id}>
                            <TableCell>
                                <p className="max-w-50 truncate">{p.name}</p>
                            </TableCell>
                            <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{relativeDate(p.modifiedAt)}</TableCell>
                            <TableCell>{p.exerciseCount}</TableCell>
                            <TableCell className="shrink-0 flex gap-1 justify-end">
                                <ProgramButton
                                    icon={PenLineIcon}
                                    onClick={async () => {
                                        const redirectUrl = await programActions.edit(p.id);
                                        if (redirectUrl) setIframeUrl(redirectUrl);
                                    }}
                                />
                                <ProgramButton icon={PrinterIcon} onClick={() => programActions.print(p.id)} />
                                <ProgramButton icon={MailIcon} onClick={() => programActions.email(p.id)} />
                                <ProgramButton icon={Trash2Icon} onClick={() => programActions.deleteProgram(p.id)} />
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            )}
        </div>
    );
};

interface IProgramButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
}

const ProgramButton = ({ icon: Icon, className, ...props }: IProgramButtonProps) => {
    return (
        <Button className={clsx("px-2!", className)} variant="ghost" {...props}>
            <Icon size={14} />
        </Button>
    );
};
