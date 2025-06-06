const Hyperlink = ({ href, children}) => {
    return (
        <div className="text-sm">
                <a href={href} className="font-semibold text-sky-600 hover:text-sky-500">
                {children}
                </a>
        </div>
    )}
export default Hyperlink;