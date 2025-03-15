// Helper method to limit execution frequency
export function throttle(
    func: Function,
    limit: number
): (...args: any[]) => void {
    let inThrottle: boolean;
    return (...args: any[]): void => {
        if (!inThrottle) {
            //@ts-ignore
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
