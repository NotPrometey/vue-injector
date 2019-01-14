import Vue from 'vue';

export interface InjectConstructor {
  readonly isVueService: boolean;
  readonly useFactory?: Function;
  readonly import?: { [key: string]: any };

  new (): InjectInterface;
}

export interface InjectInterface {
  readonly isVueService: boolean;
  readonly name: string;

  readonly context: Object;
  readonly vm: Vue;
}

export class Inject implements InjectInterface {
  static readonly isVueService: boolean;
  readonly isVueService: boolean;
  readonly name: string;
  readonly vm: Vue;
  readonly context: Object;

  static getName (): string {
    return this.name;
  }
}
