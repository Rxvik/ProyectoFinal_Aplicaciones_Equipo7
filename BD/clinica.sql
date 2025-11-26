-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:8889
-- Tiempo de generación: 26-11-2025 a las 02:38:00
-- Versión del servidor: 5.7.24
-- Versión de PHP: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `clinica`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id_cita` int(11) NOT NULL,
  `id_paciente` int(11) NOT NULL,
  `id_medico` int(11) NOT NULL,
  `fecha_cita` date NOT NULL,
  `hora_cita` time NOT NULL,
  `estado` enum('pendiente','confirmada','completada','cancelada') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `notas_medico` text COLLATE utf8mb4_unicode_ci,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`id_cita`, `id_paciente`, `id_medico`, `fecha_cita`, `hora_cita`, `estado`, `motivo`, `notas_medico`, `fecha_creacion`) VALUES
(1, 1, 2, '2025-11-25', '13:00:00', 'cancelada', NULL, NULL, '2025-11-23 03:10:56'),
(2, 1, 2, '2025-11-28', '11:15:00', 'confirmada', NULL, NULL, '2025-11-24 02:29:18'),
(3, 1, 2, '2025-11-23', '22:35:00', 'completada', NULL, NULL, '2025-11-24 02:35:42'),
(4, 7, 8, '2025-12-20', '10:00:00', 'cancelada', NULL, NULL, '2025-11-24 22:01:28'),
(5, 3, 12, '2025-11-27', '12:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(6, 8, 5, '2025-12-07', '16:00:00', 'completada', NULL, NULL, '2025-11-24 22:01:28'),
(7, 11, 7, '2025-12-16', '18:00:00', 'cancelada', NULL, NULL, '2025-11-24 22:01:28'),
(8, 7, 13, '2025-11-25', '16:00:00', 'pendiente', NULL, NULL, '2025-11-24 22:01:28'),
(9, 5, 10, '2025-12-06', '17:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(10, 5, 11, '2025-12-08', '18:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(11, 10, 12, '2025-11-25', '10:00:00', 'pendiente', NULL, NULL, '2025-11-24 22:01:28'),
(12, 8, 13, '2025-12-15', '18:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(13, 2, 8, '2025-12-14', '12:00:00', 'pendiente', NULL, NULL, '2025-11-24 22:01:28'),
(14, 10, 8, '2025-12-02', '17:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(15, 6, 13, '2025-12-20', '16:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(16, 8, 4, '2025-11-28', '11:00:00', 'completada', NULL, NULL, '2025-11-24 22:01:28'),
(17, 8, 7, '2025-12-21', '16:00:00', 'cancelada', NULL, NULL, '2025-11-24 22:01:28'),
(18, 10, 8, '2025-12-11', '16:00:00', 'cancelada', NULL, NULL, '2025-11-24 22:01:28'),
(19, 6, 6, '2025-11-27', '10:00:00', 'pendiente', NULL, NULL, '2025-11-24 22:01:28'),
(20, 2, 4, '2025-12-20', '15:00:00', 'confirmada', NULL, NULL, '2025-11-24 22:01:28'),
(21, 9, 5, '2025-12-23', '18:00:00', 'completada', NULL, NULL, '2025-11-24 22:01:28'),
(22, 7, 10, '2025-12-09', '13:00:00', 'cancelada', NULL, NULL, '2025-11-24 22:01:28'),
(23, 5, 13, '2025-11-30', '09:00:00', 'pendiente', NULL, NULL, '2025-11-24 22:01:28'),
(24, 1, 2, '2025-12-03', '20:00:00', 'pendiente', NULL, NULL, '2025-11-26 01:59:36'),
(25, 1, 2, '2025-12-05', '16:00:00', 'pendiente', NULL, NULL, '2025-11-26 02:25:19'),
(26, 1, 2, '2025-12-09', '16:00:00', 'pendiente', NULL, NULL, '2025-11-26 02:35:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horarios_medicos`
--

CREATE TABLE `horarios_medicos` (
  `id_horario` int(11) NOT NULL,
  `id_medico` int(11) NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `horarios_medicos`
--

INSERT INTO `horarios_medicos` (`id_horario`, `id_medico`, `dia_semana`, `hora_inicio`, `hora_fin`) VALUES
(6, 2, 'Lunes', '09:00:00', '17:00:00'),
(7, 2, 'Martes', '09:00:00', '17:00:00'),
(8, 2, 'Miercoles', '09:00:00', '17:00:00'),
(9, 2, 'Jueves', '09:00:00', '17:00:00'),
(10, 2, 'Viernes', '09:00:00', '17:00:00'),
(11, 3, 'Lunes', '09:00:00', '17:00:00'),
(12, 3, 'Martes', '09:00:00', '17:00:00'),
(13, 3, 'Miercoles', '09:00:00', '17:00:00'),
(14, 3, 'Jueves', '09:00:00', '17:00:00'),
(15, 3, 'Viernes', '09:00:00', '17:00:00'),
(16, 4, 'Lunes', '09:00:00', '17:00:00'),
(17, 4, 'Martes', '09:00:00', '17:00:00'),
(18, 4, 'Miercoles', '09:00:00', '17:00:00'),
(19, 4, 'Jueves', '09:00:00', '17:00:00'),
(20, 4, 'Viernes', '09:00:00', '17:00:00'),
(21, 5, 'Lunes', '09:00:00', '17:00:00'),
(22, 5, 'Martes', '09:00:00', '17:00:00'),
(23, 5, 'Miercoles', '09:00:00', '17:00:00'),
(24, 5, 'Jueves', '09:00:00', '17:00:00'),
(25, 5, 'Viernes', '09:00:00', '17:00:00'),
(26, 6, 'Lunes', '09:00:00', '17:00:00'),
(27, 6, 'Martes', '09:00:00', '17:00:00'),
(28, 6, 'Miercoles', '09:00:00', '17:00:00'),
(29, 6, 'Jueves', '09:00:00', '17:00:00'),
(30, 6, 'Viernes', '09:00:00', '17:00:00'),
(31, 7, 'Lunes', '09:00:00', '17:00:00'),
(32, 7, 'Martes', '09:00:00', '17:00:00'),
(33, 7, 'Miercoles', '09:00:00', '17:00:00'),
(34, 7, 'Jueves', '09:00:00', '17:00:00'),
(35, 7, 'Viernes', '09:00:00', '17:00:00'),
(36, 8, 'Lunes', '09:00:00', '17:00:00'),
(37, 8, 'Martes', '09:00:00', '17:00:00'),
(38, 8, 'Miercoles', '09:00:00', '17:00:00'),
(39, 8, 'Jueves', '09:00:00', '17:00:00'),
(40, 8, 'Viernes', '09:00:00', '17:00:00'),
(41, 9, 'Lunes', '09:00:00', '17:00:00'),
(42, 9, 'Martes', '09:00:00', '17:00:00'),
(43, 9, 'Miercoles', '09:00:00', '17:00:00'),
(44, 9, 'Jueves', '09:00:00', '17:00:00'),
(45, 9, 'Viernes', '09:00:00', '17:00:00'),
(46, 10, 'Lunes', '09:00:00', '17:00:00'),
(47, 10, 'Martes', '09:00:00', '17:00:00'),
(48, 10, 'Miercoles', '09:00:00', '17:00:00'),
(49, 10, 'Jueves', '09:00:00', '17:00:00'),
(50, 10, 'Viernes', '09:00:00', '17:00:00'),
(51, 11, 'Lunes', '09:00:00', '17:00:00'),
(52, 11, 'Martes', '09:00:00', '17:00:00'),
(53, 11, 'Miercoles', '09:00:00', '17:00:00'),
(54, 11, 'Jueves', '09:00:00', '17:00:00'),
(55, 11, 'Viernes', '09:00:00', '17:00:00'),
(56, 12, 'Lunes', '09:00:00', '17:00:00'),
(57, 12, 'Martes', '09:00:00', '17:00:00'),
(58, 12, 'Miercoles', '09:00:00', '17:00:00'),
(59, 12, 'Jueves', '09:00:00', '17:00:00'),
(60, 12, 'Viernes', '09:00:00', '17:00:00'),
(61, 13, 'Lunes', '09:00:00', '17:00:00'),
(62, 13, 'Martes', '09:00:00', '17:00:00'),
(63, 13, 'Miercoles', '09:00:00', '17:00:00'),
(64, 13, 'Jueves', '09:00:00', '17:00:00'),
(65, 13, 'Viernes', '09:00:00', '17:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicos`
--

CREATE TABLE `medicos` (
  `id_medico` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especialidad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `medicos`
--

INSERT INTO `medicos` (`id_medico`, `id_usuario`, `nombre_completo`, `especialidad`, `telefono`) VALUES
(2, 5, 'Dr Simi', 'General', NULL),
(3, 6, 'Dr Cepillin', 'Pediatria', '01800 719 9999'),
(4, 7, 'Dr. House', 'Dermatología', NULL),
(5, 8, 'Dra. Grey', 'Dermatología', NULL),
(6, 9, 'Dr. Strange', 'General', NULL),
(7, 10, 'Dra. Quinn', 'Cardiología', NULL),
(8, 11, 'Dr. Simi', 'Dermatología', NULL),
(9, 12, 'Dra. Polo', 'Neurología', NULL),
(10, 13, 'Dr. Who', 'General', NULL),
(11, 14, 'Dr. Banner', 'Dermatología', NULL),
(12, 15, 'Dra. Foster', 'Dermatología', NULL),
(13, 16, 'Dr. Octopus', 'Neurología', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id_paciente` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id_paciente`, `id_usuario`, `nombre_completo`, `telefono`) VALUES
(1, 2, 'Fede Crusher', NULL),
(2, 17, 'Penel Ra', '555-0000'),
(3, 18, 'Maria Test', '555-0000'),
(4, 19, 'Juan Test', '555-0000'),
(5, 20, 'Luisa Test', '555-0000'),
(6, 21, 'Carlos Test', '555-0000'),
(7, 22, 'Ana Test', '555-0000'),
(8, 23, 'Pedro Test', '555-0000'),
(9, 24, 'Sofia Test', '555-0000'),
(10, 25, 'Miguel Test', '555-0000'),
(11, 26, 'Laura Test', '555-0000');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','medico','paciente') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `email`, `password_hash`, `rol`, `fecha_creacion`) VALUES
(1, 'admin@papuclinica.com', '$2y$10$U2B3rECOb25.r9FhndljMewccce3MVx9O5gi0yp4E7trVS4Yuaica', 'admin', '2025-11-22 04:57:10'),
(2, 'fede@elobo.com', '$2y$10$7e5Uze.UwYoOiAxhgSnAxu84tildYIR5tXlHqjc4AcFPVwUtMxUCe', 'paciente', '2025-11-22 07:32:05'),
(5, 'drsimi@simi.com', '$2y$10$wakpUM.fWDn.PPaNiDA.JeXKBtHB0aqsQVL39JTzUqznRdmwJJ9ei', 'medico', '2025-11-23 03:06:05'),
(6, 'drcepillin@cepillin.com', '$2y$10$M48zNrtK3AHWU26rnJSSfezSBGwB.TP36hFycVFIF6IttiKOIgV6O', 'medico', '2025-11-24 20:50:21'),
(7, 'doc1@test.com', '$2y$10$.7Q.y9AcHULvZ1iBrlNmneTXF.PuWfwXq7x028SBBEaFBxZgveSGq', 'medico', '2025-11-24 22:01:27'),
(8, 'doc2@test.com', '$2y$10$Ad/.77jSg8w62Z4YYA2DDu8IMCbUUy3jgkJ/TIGQMPcTCAJBg.FWm', 'medico', '2025-11-24 22:01:27'),
(9, 'doc3@test.com', '$2y$10$TKJnQT9Ac8s74Xza36Bn0.SGNdfj8tUS6BJ/kWF7wOznEQWKlHX9m', 'medico', '2025-11-24 22:01:27'),
(10, 'doc4@test.com', '$2y$10$fF3NTBAHzAm3ylakTtxtdevTFxQRbc2/5AE5d0RE/07FmzTAAkD3C', 'medico', '2025-11-24 22:01:28'),
(11, 'doc5@test.com', '$2y$10$ytlGyVcZuyviT0Z977zfg.BHkpsgRQaZ8bs.qqWos0bs9EEvbnfWO', 'medico', '2025-11-24 22:01:28'),
(12, 'doc6@test.com', '$2y$10$sBy/FQ4zQKXkbHmG8Wu9r.i9V1qLAjQ90KGLYsCHytvHKmdM1i97G', 'medico', '2025-11-24 22:01:28'),
(13, 'doc7@test.com', '$2y$10$MQvUzBhWnrri68a0jWskEOw6m20Qz/KHGHVULgr91dJZtLAeJaKlO', 'medico', '2025-11-24 22:01:28'),
(14, 'doc8@test.com', '$2y$10$CkMmAVeS/PLDWVnvbuXfb.mKEBOaG4DruYNwN5xVqeueeBG0e.vYq', 'medico', '2025-11-24 22:01:28'),
(15, 'doc9@test.com', '$2y$10$qaFD3Tztla9hHa0AmpDJv.MdPb1nXOs.3G4QAl3lzji91IJ7Vs3fu', 'medico', '2025-11-24 22:01:28'),
(16, 'doc10@test.com', '$2y$10$U4FNeFi3X6ISSOwgrLC1Ae3MLArfApFqtpX.QL120at8ZMFeIySK6', 'medico', '2025-11-24 22:01:28'),
(17, 'cuantollevamosgrabando@penel.com', '$2y$10$SQRHraQhKrmzr0Gf3PZeE.BEgvYwy6Fbn/n0rKPy5kDYkH7EMZ86a', 'paciente', '2025-11-24 22:01:28'),
(18, 'paciente2@test.com', '$2y$10$tNLI9NJjVsc7UTXGs8JrMOaYuSvwyWAlV0jdqkIEiYXTT0LdG3aJu', 'paciente', '2025-11-24 22:01:28'),
(19, 'paciente3@test.com', '$2y$10$6r46IMRknn6sw2u5LrP.zeHpXAP7DFVTOpzNeniqhAtzS6PjfofVy', 'paciente', '2025-11-24 22:01:28'),
(20, 'paciente4@test.com', '$2y$10$ZLSNcI/mT.7jYOqLDBYa3eRO4KBS9TuWcMEXIRKsIIdXbh6/ovOEC', 'paciente', '2025-11-24 22:01:28'),
(21, 'paciente5@test.com', '$2y$10$oLthAwPnWKvBSpjpsFARmuMBch72ETZAa5DdRWUASc19CmdPz4ri.', 'paciente', '2025-11-24 22:01:28'),
(22, 'paciente6@test.com', '$2y$10$fHz55I3Jj9sVgiWd1sN/Keq02rIJEnX7X7CvYvvhKYTEaOHZ9BPaq', 'paciente', '2025-11-24 22:01:28'),
(23, 'paciente7@test.com', '$2y$10$XgJzVMKYl2NJPDNLVxtpm.ibJuMkWCzE2tqtiYI8X4pXu3gdZ5tzG', 'paciente', '2025-11-24 22:01:28'),
(24, 'paciente8@test.com', '$2y$10$jxpQPbjwGneOnNUGJoXs2u33nkzur4fmF95yLwSApmDORG1ppUF3y', 'paciente', '2025-11-24 22:01:28'),
(25, 'paciente9@test.com', '$2y$10$wKORVhGzy5.sZ3SZISLHm.s6Qlj8FyFke8qMSrDzpJxIyDiIQ3Poq', 'paciente', '2025-11-24 22:01:28'),
(26, 'paciente10@test.com', '$2y$10$rdVh4aGa5Vwc007R/.iMDu833OQBzUFXQby5qyLEX0zDwLsTTSSJC', 'paciente', '2025-11-24 22:01:28');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id_cita`),
  ADD KEY `id_paciente` (`id_paciente`),
  ADD KEY `id_medico` (`id_medico`);

--
-- Indices de la tabla `horarios_medicos`
--
ALTER TABLE `horarios_medicos`
  ADD PRIMARY KEY (`id_horario`),
  ADD KEY `id_medico` (`id_medico`);

--
-- Indices de la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD PRIMARY KEY (`id_medico`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id_paciente`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id_cita` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `horarios_medicos`
--
ALTER TABLE `horarios_medicos`
  MODIFY `id_horario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT de la tabla `medicos`
--
ALTER TABLE `medicos`
  MODIFY `id_medico` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id_paciente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id_paciente`) ON DELETE CASCADE,
  ADD CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`id_medico`) REFERENCES `medicos` (`id_medico`) ON DELETE CASCADE;

--
-- Filtros para la tabla `horarios_medicos`
--
ALTER TABLE `horarios_medicos`
  ADD CONSTRAINT `horarios_medicos_ibfk_1` FOREIGN KEY (`id_medico`) REFERENCES `medicos` (`id_medico`) ON DELETE CASCADE;

--
-- Filtros para la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD CONSTRAINT `medicos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
