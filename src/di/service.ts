import { InjectInterface } from './inject';

function createDecorator (factory) {
  return function (target: any, key: string, index: any) {
    const Ctor = typeof target === 'function'
      ? target
      : target.constructor;
    if (!Ctor.__decorators__) {
      Ctor.__decorators__ = [];
    }
    if (typeof index !== 'number') {
      index = undefined;
    }
    Ctor.__decorators__.push(function (options) {
      return factory(options, key, index);
    });
  };
}

export function Service (service: any): any {
  return createDecorator((componentOptions, k, index) => {
    (componentOptions.providers || (componentOptions.providers = {}))[k] = service;
  });
}
