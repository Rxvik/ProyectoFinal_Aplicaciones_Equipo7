<?php

    date_default_timezone_set('America/Mexico_City');
    
    $servidor = 'localhost';
    $puerto = '8889';
    $nombre_bd = 'clinica';
    $usuario_bd = 'root';
    $clave_bd = 'root';

    $info_de_red = "mysql:host=$servidor;port=$puerto;dbname=$nombre_bd;charset=utf8mb4";
    $configuracion = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $conexion = new PDO($info_de_red, $usuario_bd, $clave_bd, $configuracion);
    } catch (\PDOException $error) {
        echo "Error de conexión: " . $error->getMessage();
        exit;
    }
