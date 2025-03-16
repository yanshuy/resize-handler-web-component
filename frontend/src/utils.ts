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

export function html(strings: TemplateStringsArray, ...values: any[]): string {
    let result = "";
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length) {
            result += values[i];
        }
    }
    return result;
}
