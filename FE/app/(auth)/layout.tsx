const AuthLayout = ({
    children
}: {
    children: React.ReactNode
}) => {
    return (
        <div className="h-full flex items-center justify-center bg-muted">
            {children}
        </div>
    );
}

export default AuthLayout;
