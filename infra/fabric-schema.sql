-- Microsoft Fabric Lakehouse schema for AgriValue IQ
-- Run in your Fabric Warehouse or Lakehouse SQL endpoint

CREATE TABLE dbo.agrivalue_crops (
    crop_name        NVARCHAR(50)  NOT NULL,
    base_price       DECIMAL(10,2) NOT NULL,
    processed_price  DECIMAL(10,2) NOT NULL,
    processed_name   NVARCHAR(200) NOT NULL,
    region           NVARCHAR(100) NOT NULL,
    certifications   NVARCHAR(500) NULL,
    record_type      NVARCHAR(20)  NOT NULL,  -- 'current', 'history', 'forecast'
    price            DECIMAL(10,2) NULL,
    sort_order       INT           NOT NULL DEFAULT 0
);

CREATE TABLE dbo.agrivalue_processors (
    name     NVARCHAR(200) NOT NULL,
    inputs   NVARCHAR(50)  NOT NULL,
    costs    DECIMAL(10,2) NOT NULL,
    location NVARCHAR(100) NOT NULL
);

-- Seed Olive Oil (example — replicate for all 5 crops)
INSERT INTO dbo.agrivalue_crops VALUES
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', 'EU DOP|USDA Organic|FLO-CERT-2026', 'current', 1200, 0),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'history', 1100, 1),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'history', 1150, 2),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'history', 1180, 3),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'history', 1220, 4),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'history', 1200, 5),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'forecast', 1250, 1),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'forecast', 1300, 2),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'forecast', 1380, 3),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'forecast', 1450, 4),
('Olive Oil', 1200, 6800, 'Extra Virgin Olive Oil DOP', 'Val di Mazara, Sicily', NULL, 'forecast', 1550, 5);

INSERT INTO dbo.agrivalue_processors VALUES
('Frantoio Oleario Siciliano', 'Olive Oil', 350, 'Palermo'),
('Cantina Nero d''Avola', 'Grapes', 250, 'Noto'),
('Green Valley Mill', 'Wheat', 30, 'Catania'),
('Artisanal Roasters Ltd', 'Coffee', 180, 'Catania'),
('Highland Cheese Plant', 'Milk', 250, 'Enna');
