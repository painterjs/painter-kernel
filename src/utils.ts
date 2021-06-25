import calculate from './calc';
import { IView, penCache } from './pen';

let screenK = 0.5,
  scale = 1;

const parsePx = (origin: string, baseSize: number = 100) => {
  const results = /-?[0-9]+(\.[0-9]+)?(rpx|px|%)/.exec(origin);
  if (!origin || !results) {
    console.error(`The size: ${origin} is illegal`);
    return '0';
  }
  const unit = results[2];
  const value = parseFloat(origin);

  let res = 0;
  if (unit === 'rpx') {
    res = Math.round(value * (screenK || 0.5) * (scale || 1));
  } else if (unit === 'px') {
    res = Math.round(value * (scale || 1));
  } else if (unit === '%') {
    res = Math.round((value * baseSize) / 100);
  }
  return String(res);
};

export function toPx(str: string | number, baseSize?: number): number {
  if (typeof str === 'number') return str;
  if (str === '0') {
    return 0;
  }
  const formula = /^calc\((.+)\)$/.exec(str);
  if (formula && formula[1]) {
    const afterOne = formula[1].replace(/([^\s\(\+\-\*\/]+)\.(left|right|bottom|top|width|height)/g, word => {
      const [id, attr] = word.split('.');
      if (penCache.viewRect[id]) {
        return penCache.viewRect[id]![attr];
      } else {
        return 0;
      }
    });
    const afterTwo = afterOne.replace(/-?[0-9]+(\.[0-9]+)?(rpx|px|%)/g, origin => parsePx(origin, baseSize));
    return calculate(afterTwo);
  } else {
    return Number(parsePx(str, baseSize));
  }
}

export function setStringPrototype(screenK = 0.5, scale = 1) {
  screenK = screenK;
  scale = scale;
}

interface Injection {
  loadImage: (url: string) => Promise<{
    img: any;
    width: number;
    height: number;
  }>;
  getRatio: () => number;
  customActions: {
    [type: string]: {
      layout: (
        view: IView,
        viewRects: {
          [id: string]: {
            width: number;
            height: number;
            left: number;
            top: number;
            right: number;
            bottom: number;
          };
        },
      ) => {
        left: number;
        top: number;
        right: number;
        bottom: number;
      };
      draw: (view: IView, ctx: CanvasRenderingContext2D) => Promise<void>;
    };
  };
}

export let injection: Injection = {
  loadImage(url: string) {
    return Promise.resolve({
      img: url,
      width: 0,
      height: 0,
    });
  },
  getRatio() {
    return 1;
  },
  customActions: {},
};

export function initInjection(inject: Partial<Injection>) {
  injection = {
    ...injection,
    ...inject,
  };
}
