interface ITableProps {
    columns: string[];
    children: React.ReactNode;
}

export const Table = (props: ITableProps) => {
    return (
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-left">
                    <tr>
                        {props.columns.map((colName, ic) => (
                            <th key={ic} className="px-4 py-2 font-medium whitespace-nowrap">
                                {colName}
                            </th>
                        ))}

                        <th />
                    </tr>
                </thead>
                <tbody>{props.children}</tbody>
            </table>
        </div>
    );
};

interface ITableRowProps {
    onClick?: () => unknown;
    children: React.ReactNode;
}

export const TableRow = (props: ITableRowProps) => {
    return (
        <tr
            onClick={() => {
                if (props.onClick) props.onClick();
            }}
            className="border-t border-zinc-200 hover:bg-zinc-50 cursor-pointer"
        >
            {props.children}
        </tr>
    );
};

interface ITableDataProps {
    unstyled?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const TableCell = (props: ITableDataProps) => {
    return <td className={(props.unstyled ? "" : "px-4 py-4 text-zinc-600") + " " + props.className}>{props.children}</td>;
};
