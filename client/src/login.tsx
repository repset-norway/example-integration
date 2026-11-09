import { useAuth } from "./auth/use-auth";
import { Button } from "./components/button";
import { Card } from "./components/card";
import { Input } from "./components/input";
import { Layout } from "./layout";
import { PatientList } from "./patient-list";

export const Login = () => {
    const auth = useAuth();

    if (auth.status === "authenticated") {
        return (
            <Layout user={auth.user!} onLogout={auth.logout}>
                <PatientList user={auth.user!} checkAuth={auth.checkAuth} />
            </Layout>
        );
    }

    const onLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;

        const success = await auth.login(username, password);
        if (!success) alert("failed to log in. Try another username.")
    };

    return (
        <Layout>
            <Card>
                {auth.status === "loading" ? (
                    <p>Loading</p>
                ) : (
                    <form onSubmit={onLogin}>
                        <p className="text-xl">Login</p>
                        <p className="mt-2 mb-6 text-gray-500">
                            If the user don't exist it will be created. For security purposes the database is wiped every week. Please don't link this demo to a senstive Repset account.
                        </p>

                <div className="space-y-3">
                        <Input autoComplete="off" name="username" placeholder="username" />
                        <Input name="password" type="password" placeholder="password" />
                  <div className="flex justify-end">
                        <Button type="submit">Log in</Button>
                  </div>
                </div>
                    </form>
                )}
            </Card>

            <p className="text-center mt-10">Demo app <b>database is wiped every sunday</b> for security purposes</p>
        </Layout>
    );
};
