DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS work_images;

ALTER TABLE User
  ADD COLUMN certificates TEXT,
  ADD COLUMN gallery TEXT;
