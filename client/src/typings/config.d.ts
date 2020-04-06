declare type Environment = "dev" | "test" | "prod";

declare interface IAppConfig {
  apiBaseUrl: string;
  environment: Environment;
}

declare var APP_CONFIG: IAppConfig;
