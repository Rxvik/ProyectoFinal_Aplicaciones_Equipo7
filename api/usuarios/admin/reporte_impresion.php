<?php

    require_once '../../config/db.php';
    session_start();

    if (!isset($_SESSION['id_usuario']) || $_SESSION['rol'] !== 'admin') {
        die("Acceso denegado");
    }

    $filtro_medico = $_GET['medico'] ?? 'todos';
    $filtro_estado = $_GET['estado_cita'] ?? 'todas'; 
    $fecha_inicio  = $_GET['fecha_inicio'] ?? '';
    $fecha_fin     = $_GET['fecha_fin'] ?? '';

    try {

        $sql = "SELECT c.fecha_cita, c.hora_cita, c.estado, 
                    p.nombre_completo as paciente, 
                    m.nombre_completo as medico
                FROM citas c
                INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
                INNER JOIN medicos m ON c.id_medico = m.id_medico
                WHERE 1=1";

        $params = [];

        if ($filtro_medico !== 'todos' && $filtro_medico !== '') {
            $sql .= " AND c.id_medico = ?";
            $params[] = $filtro_medico;
        }

        if ($filtro_estado !== 'todas' && $filtro_estado !== '') {
            $sql .= " AND c.estado = ?";
            $params[] = $filtro_estado;
        }

        if (!empty($fecha_inicio)) {
            $sql .= " AND c.fecha_cita >= ?";
            $params[] = $fecha_inicio;
        }

        if (!empty($fecha_fin)) {
            $sql .= " AND c.fecha_cita <= ?";
            $params[] = $fecha_fin;
        }

        $sql .= " ORDER BY c.fecha_cita DESC, c.hora_cita ASC";

        $consulta = $conexion->prepare($sql);
        $consulta->execute($params);
        $citas = $consulta->fetchAll();

    } catch (Exception $e) {
        die("Error: " . $e->getMessage());
    }
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Citas</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .badge { padding: 4px; border-radius: 4px; color: white; font-size: 12px; }
        .pendiente { background: #f0ad4e; } .confirmada { background: #007bff; }
        .completada { background: #28a745; } .cancelada { background: #dc3545; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>

    <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">🖨️ Imprimir / Guardar PDF</button>
    </div>

    <h2 style="text-align: center; color: #004085;">Reporte de Citas - Papuclinica</h2>

    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 14px;">
        <strong>📅 Periodo:</strong> 
        <?php echo ($fecha_inicio ? $fecha_inicio : 'Inicio') . ' al ' . ($fecha_fin ? $fecha_fin : 'Hoy'); ?> <br>
        <strong>👨‍⚕️ Médico:</strong> <?php echo htmlspecialchars($filtro_medico); ?> <br>
        <strong>📌 Estado:</strong> <?php echo htmlspecialchars($filtro_estado); ?> <br>
        <strong>📊 Total Resultados:</strong> <?php echo count($citas); ?>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            <?php if (count($citas) > 0): ?>
                <?php foreach ($citas as $c): ?>
                    <tr>
                        <td><?php echo $c['fecha_cita']; ?></td>
                        <td><?php echo $c['hora_cita']; ?></td>
                        <td><?php echo $c['paciente']; ?></td>
                        <td><?php echo $c['medico']; ?></td>
                        <td><span class="badge <?php echo $c['estado']; ?>"><?php echo $c['estado']; ?></span></td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr><td colspan="5" style="text-align: center;">No se encontraron citas en este periodo.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>

</body>
</html>