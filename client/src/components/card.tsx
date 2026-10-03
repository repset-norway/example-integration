interface ICardProps {
    className?: string;
    children?: React.ReactNode;
}

export const Card = (props: ICardProps) => {
    return (
        <div className={"bg-white w-full shadow-sm rounded-lg p-5 flex items-center justify-between" + " " + props.className}>
            {props.children}
        </div>
    );
};
