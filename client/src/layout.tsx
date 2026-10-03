import type { IUser } from "./auth/use-auth";

interface ILayoutProps {
    children: React.ReactNode;
    user?: IUser | null;
    onLogout?: () => unknown;
}

export const Layout = (props: ILayoutProps) => {
    return (
        <main className="flex flex-col items-center w-full pt-12 min-h-screen bg-[#fafafa]">
            <div className="flex flex-col w-full max-w-200">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <img src="/logo-black-text.svg" alt="logo" width={100} />
                        <h2 className="text-gray-500 text-sm mt-2 w-150">
                            This demo shows an example of how a third-party system can integrate with Repset. It uses Repset's integration API.
                        </h2>
                    </div>

                    {props.user && (
                        <div className="flex flex-col items-end justify-end">
                            <p>User: {props.user.username}</p>
                            <button onClick={props.onLogout} className="text-blue-600 underline cursor-pointer">Log out</button>
                        </div>
                    )}
                </header>

                {props.children}
            </div>
        </main>
    );
};
