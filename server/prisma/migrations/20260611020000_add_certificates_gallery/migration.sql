CREATE TABLE certificates (
  id VARCHAR(36) NOT NULL,
  worker_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  image_url TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX certificates_worker_id_idx (worker_id),
  CONSTRAINT certificates_worker_id_fk FOREIGN KEY (worker_id) REFERENCES `User`(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE work_images (
  id VARCHAR(36) NOT NULL,
  worker_id VARCHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX work_images_worker_id_idx (worker_id),
  CONSTRAINT work_images_worker_id_fk FOREIGN KEY (worker_id) REFERENCES `User`(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
