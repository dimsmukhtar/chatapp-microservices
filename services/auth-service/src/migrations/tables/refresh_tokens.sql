CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_refresh_token_user_id (user_id),
    KEY idx_refresh_token_expires_at (expires_at),
    KEY idx_refresh_token_revoked_at (revoked_at),
    UNIQUE KEY refresh_token_unique_token_hash (token_hash),
    CONSTRAINT fk_refresh_tokens_user_credentials FOREIGN KEY (user_id) REFERENCES user_credentials (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4