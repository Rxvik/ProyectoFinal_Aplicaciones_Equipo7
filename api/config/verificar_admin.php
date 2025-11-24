<?php
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    
    if (!isset($_SESSION['id_usuario']) || $_SESSION['rol'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['status' => false, 'message' => 'Acceso denegado: Solo para Administradores.']);
        exit;
    }