// Función para procesar y cargar datos desde un archivo Excel
function processData() {
    const fileInput = document.getElementById('input-excel');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, selecciona un archivo de Excel.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Calcular máximos para el índice compuesto
        const so2Max = Math.max(...json.map(row => row['SO2']));
        const seismicMax = Math.max(...json.map(row => row['Actividad Sísmica']));
        const heightMax = Math.max(...json.map(row => row['Altura Máxima']));

        // Calcular índice compuesto y evaluación para cada registro
        const results = json.map(row => {
            const so2 = row['SO2'];
            const seismic = row['Actividad Sísmica'];
            const height = row['Altura Máxima'];
            const index = 0.3 * (so2 / so2Max) + 0.4 * (seismic / seismicMax) + 0.3 * (height / heightMax);
            let evaluation = '';
            if (index < 0.4) {
                evaluation = 'Inactivo';
            } else if (index < 0.6) {
                evaluation = 'Incremento de actividad sísmica';
            } else if (index < 0.8) {
                evaluation = 'Aumento de actividad eruptiva';
            } else {
                evaluation = 'Erupción crítica';
            }
            return { ...row, 'Índice Compuesto': index.toFixed(2), 'Índice de Evaluación': evaluation };
        });

        // Guardar los datos en localStorage para uso posterior
        localStorage.setItem('volcanoData', JSON.stringify(results));

        displayResults(results);
        createChart(results);
    };

    reader.readAsArrayBuffer(file);
}

// Función para mostrar los resultados en la tabla
function displayResults(results) {
    const tbody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    results.forEach((row, index) => {
        const newRow = tbody.insertRow();
        newRow.insertCell().innerText = row['Día'];
        newRow.insertCell().innerText = row['Mes'];
        newRow.insertCell().innerText = row['Año'];
        newRow.insertCell().innerText = row['SO2'];
        newRow.insertCell().innerText = row['Actividad Sísmica'];
        newRow.insertCell().innerText = row['Altura Máxima'];
        newRow.insertCell().innerText = row['Índice Compuesto']; // Usamos 'Índice Compuesto' en lugar de 'index'
        newRow.insertCell().innerText = row['Índice de Evaluación']; // Usamos 'Índice de Evaluación' en lugar de 'evaluation'
    });
}

// Función para crear el gráfico de índice compuesto
function createChart(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const labels = data.map(row => `Día ${row['Día']}`);
    const indices = data.map(row => parseFloat(row['Índice Compuesto'])); // Usamos 'Índice Compuesto'

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Índice Compuesto',
                data: indices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Función para descargar el reporte en PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;

    // Crear nuevo PDF
    const doc = new jsPDF();

    // Añadir título y tabla al PDF
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 255);
    doc.text('Reporte de Actividad Volcánica', 10, 10);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Aquí tienes un análisis completo de los datos volcánicos registrados.', 10, 20);

    // Añadir tabla
    const data = JSON.parse(localStorage.getItem('volcanoData'));
    const tableRows = [];

    data.forEach(item => {
        const rowData = [
            item['Día'], 
            item['Mes'], 
            item['Año'], 
            item['SO2'], 
            item['Actividad Sísmica'], 
            item['Altura Máxima'], 
            item['Índice Compuesto'], // Usamos 'Índice Compuesto'
            item['Índice de Evaluación'] // Usamos 'Índice de Evaluación'
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [['Día', 'Mes', 'Año', 'SO2', 'Actividad Sísmica', 'Altura Máxima', 'Índice Compuesto', 'Índice de Evaluación']],
        body: tableRows,
        startY: 30,
        styles: { fillColor: [255, 0, 0] },
        headStyles: { fillColor: [0, 0, 255] },
        theme: 'grid'
    });

    // Añadir gráfico
    html2canvas(document.getElementById('myChart')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.addImage(imgData, 'PNG', 10, 10, 180, 100);

        // Añadir comentario alegre y frase motivadora
        doc.setFontSize(16);
        doc.setTextColor(0, 128, 0);
        doc.text('¡Buen trabajo!', 10, 120);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Sigue adelante con este excelente proyecto. ¡Estás haciendo una gran diferencia!', 10, 130);
        doc.text('Frase motivadora: "El éxito es la suma de pequeños esfuerzos repetidos día tras día." - Robert Collier', 10, 140);

        // Descargar PDF
        doc.save('reporte_volcanico.pdf');
    });
}
