import type { IUser } from "./auth/use-auth";

interface ILayoutProps {
    children: React.ReactNode;
    user?: IUser | null;
    onLogout?: () => unknown;
}

export const Layout = (props: ILayoutProps) => {
    return (
        <main className="flex flex-col items-center w-full p-4 pt-12 min-h-screen bg-[#fafafa]">
            <div className="flex flex-col w-full max-w-200">
                <header className="mb-10 flex items-center justify-between gap-5">
                    <div className="flex flex-col items-start">
                        <img src="/logo-black-text.svg" alt="logo" width={100} />
                        <h2 className="text-gray-500 text-sm mt-2 max-w-120">
                            This demo shows an example of how a third-party system can integrate with Repset. It uses Repset's integration
                            API.
                        </h2>

                        <a
                            href="https://github.com/repset-norway/example-integration"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline mt-3"
                        >
                            View source code
                        </a>

                        <a
                            href="https://repset.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline mt-3"
                        >
                            Developer page
                        </a>
                    </div>

                    {props.user && (
                        <div className="flex flex-col items-end justify-end">
                            <p className="">User: {props.user.username}</p>
                            <button onClick={props.onLogout} className="text-blue-600 underline cursor-pointer text-nowrap">
                                Log out
                            </button>
                        </div>
                    )}
                </header>

                {props.children}
            </div>
        </main>
    );
};
