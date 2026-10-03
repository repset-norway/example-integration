import type { IPatient } from "./api/models/patient";

export const useProgramActions = (patient: IPatient, refetch: () => unknown) => {
    const create = async (): Promise<string | null> => {
        const res = await fetch(`/api/patients/${patient.id}/program`, {
            method: "post",
        });

        if (res.status === 403) {
            alert("Workout programs require a connected Repset account");
            return null;
        }
        if (!res.ok) {
            alert("Failed to create program");
            return null;
        }

        const data = await res.json();
        return data.redirectUrl;
    };

    const edit = async (programId: string): Promise<string | null> => {
        const res = await fetch(`/api/patients/${patient.id}/program/${programId}`, {
            method: "put",
        });

        if (res.status === 403) {
            alert("Workout programs require a connected Repset account");
            return null;
        }
        if (!res.ok) {
            alert("Failed to edit program");
            return null;
        }

        const data = await res.json();
        return data.redirectUrl;
    };

    const deleteProgram = async (programId: string) => {
        const shouldDelete = window.confirm("Do you want to delete the program?");
        if (!shouldDelete) return;

        const res = await fetch(`/api/patients/${patient.id}/program/${programId}`, {
            method: "delete",
        });

        if (res.status === 403) return alert("Workout programs require a connected Repset account");
        if (!res.ok) return alert("Failed to delete program");
        refetch();
    };

    const email = async (programId: string) => {
        const email = window.prompt("Email Address:", patient.email);
        if (!email) return;

        const res = await fetch(`/api/patients/${patient.id}/program/${programId}/email`, {
            method: "post",
            body: JSON.stringify({ recipientEmailAddress: email }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) return alert("Failed to send email. Double check the email address");

        alert("Email sent successfully");
        refetch();
    };

    const print = async (programId: string) => {
        console.log(programId);
        const res = await fetch(`/api/patients/${patient.id}/program/${programId}/print`, {
            method: "post",
        });

        if (!res.ok) return alert("Failed to print");

        refetch();

        const data = await res.json();
        window.open(data.redirectUrl, "_blank", "noreferrer");
    };

    return {
        create,
        edit,
        deleteProgram,

        email,
        print,
    };
};
