export function hexToHsl(hex: string): string {
    // Remove hash if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta == 0)
        h = 0;
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    else if (cmax == g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    // Return space separated H S% L% usually required by Tailwind CSS variables if configured as numbers
    // But our globals.css uses standard H S% L% format usually without commas for modern CSS, 
    // but Shadcn usually expects "0 0% 100%" (space separated, no deg/percent logic embedded in variable if using `hsl(var(--primary))`)
    // Wait, check globals.css: `43 74% 49%`. 
    // Yes, so we return "H S% L%".
    return `${h} ${s}% ${l}%`;
}
