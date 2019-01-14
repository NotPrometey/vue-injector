import { assert } from '../util/warn';
import Vue from 'vue';
import { InjectedObject } from '../../types';
import { Inject } from '../index';
import { InjectConstructor } from './inject';
import { ServiceFactory } from './factory';

export class Provider {
  app: Vue;
  services: Map<InjectConstructor, Inject | Object>;

  commonProviders: Array<typeof Inject> = [];

  private serviceFactory: ServiceFactory = new ServiceFactory();

  constructor (app: Vue, rootProviders) {
    this.app = app;
    this.commonProviders = rootProviders;

    this.services = new Map();
  }

  registerComponent (component: Vue) {
    this.injectCommonServices(component);

    if (this.hasProviders(component)) {
      this.injectComponentServices(component);
    }
  }

  registerService (target: InjectedObject, name: string, Service: InjectConstructor): Inject | Object {
    const service = this.getService(Service);

    if (service) {
      if (Service.import) {
        this.registerImport(service, Service.import);
      }

      this.injectService(target, [{ name, service }]);

      return service;
    }

    assert(false, 'no decorator Injectable or extends Inject');
  }

  set (Service: typeof Inject) {
    if (this.checkGetName(Service)) {
      this.registerService(this.app, Service.getName(), Service);
    }
  }

  get (Service: typeof Inject) {
    if (!this.services.has(Service)) {
      this.set(Service);
    }

    return this.services.get(Service);
  }

  private registerImport (provider, imports) {
    if (this.checkObject(imports)) {
      const services = Object.keys(imports)
        .map((name: string) => {
          const service = this.registerService(provider, name, imports[name]);

          return {
            name,
            service
          };
        })
        .filter(inject => inject.service instanceof Inject);

      this.injectService(provider, services);
    } else {
      assert(false, 'providers not object');
    }
  }

  private getService (Service: InjectConstructor) {
    if (!this.services.has(Service) && Service.isVueService) {
      this.createService(Service);
    }

    return this.services.get(Service);
  }

  private createService (Service: InjectConstructor) {
    Service.prototype.vm = this.app;

    if (Service.import) {
      this.registerImport(Service.prototype, Service.import);
    }

    this.services.set(Service, this.serviceFactory.getNewService(Service));
  }

  private hasProviders (component: any): boolean {
    return component.hasOwnProperty('_providers');
  }

  private injectCommonServices (target: Vue) {
    if (this.commonProviders.length) {
      this.commonProviders.forEach(provider => {
        if (this.checkGetName(provider)) {
          this.registerService(target, provider.getName(), provider);
        }
      });
    }
  }

  private injectComponentServices (target: Vue) {
    const providers = target._providers;

    if (providers && this.checkObject(providers)) {
      Object.keys(providers).forEach(name => {
        if (providers && providers.hasOwnProperty(name)) {
          this.registerService(target, name, providers[name]);
        }
      });
    } else {
      assert(false, 'providers not object');
    }
  }

  private injectService (target: InjectedObject, imports: Array<{ name: string, service?: Inject | Object}>) {
    imports.forEach((Inject: { name: string, service?: Inject | Object}) => {
      const injectServiceName = Inject.name;

      if (!Object.hasOwnProperty.call(target, injectServiceName) && Inject.service) {
        Reflect.defineProperty(target, injectServiceName, {
          enumerable: true,
          get () {
            return Inject.service;
          }
        });
      }
    });
  }

  private checkObject (obj: any): boolean {
    return !Array.isArray(obj) && typeof obj === 'object' && obj !== null;
  }

  private checkGetName (provider: any): boolean {
    if (Object.hasOwnProperty.call(provider, 'getName') && typeof provider.getName === 'function') {
      return true;
    } else {
      assert(false, 'no decorator Injectable or extends Inject');
      return false;
    }
  }
}
