from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    SAML_SP_ENTITY_ID: str
    SAML_IDP_METADATA_URL: str
    SAML_SP_PRIVATE_KEY_FILE: str
    SAML_SP_CERT_FILE: str
    # LDAP / Active Directory
    LDAP_SERVER: str = ""
    LDAP_BIND_DN: str = ""
    LDAP_BIND_PASSWORD: str = ""
    LDAP_BASE_DN: str = ""

    ALLOWED_ORIGINS: str = "http://localhost:5173"
    SESSION_EXPIRE_HOURS: int = 8
    RATE_LIMIT_CHECK: str = "100/hour"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
