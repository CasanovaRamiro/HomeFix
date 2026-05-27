-- Update existing status values from Spanish to English
UPDATE `Application` SET `status` = 'Accepted'  WHERE `status` = 'Aceptada';
UPDATE `Application` SET `status` = 'Rejected'  WHERE `status` = 'Rechazada';
UPDATE `Application` SET `status` = 'Pending'   WHERE `status` = 'Pendiente';
