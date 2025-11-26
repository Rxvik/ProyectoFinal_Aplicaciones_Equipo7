<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';

    session_start();

    if (!isset($_SESSION['id_usuario']) || !isset($_SESSION['rol'])) {
        http_response_code(401);
        echo json_encode(['status' => false, 'message' => 'No hay sesión activa']);
        exit;
    }

    $id_usuario = $_SESSION['id_usuario'];
    $rol        = $_SESSION['rol'];

    try {
        $datos_usuario = [];

        if ($rol === 'paciente') {
            $sql = "SELECT p.nombre_completo, p.telefono, u.email 
                    FROM pacientes p 
                    INNER JOIN usuarios u ON p.id_usuario = u.id_usuario 
                    WHERE u.id_usuario = ?";
            
            $consulta = $conexion->prepare($sql);
            $consulta->execute([$id_usuario]);
            $datos_usuario = $consulta->fetch();

        } else if ($rol === 'medico') {
            $sql = "SELECT m.nombre_completo, m.especialidad, u.email 
                    FROM medicos m 
                    INNER JOIN usuarios u ON m.id_usuario = u.id_usuario 
                    WHERE u.id_usuario = ?";
            
            $consulta = $conexion->prepare($sql);
            $consulta->execute([$id_usuario]);
            $datos_usuario = $consulta->fetch();

        } else if ($rol === 'admin') {
            $datos_usuario = [
                'nombre_completo' => 'Administrador',
                'email' => $_SESSION['email']
            ];
        }

        if ($datos_usuario) {
            echo json_encode([
                'status' => true,
                'usuario' => $datos_usuario,
                'rol' => $rol
            ]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Perfil no encontrado']);
        }

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
