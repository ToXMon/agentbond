declare module "vanta/dist/vanta.net.min" {
  type VantaEffect = {
    destroy: () => void;
  };

  type VantaOptions = {
    el: HTMLElement | null;
    THREE: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    color?: number;
    backgroundColor?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
  };

  const VANTA: (options: VantaOptions) => VantaEffect;
  export default VANTA;
}
