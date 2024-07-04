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

        // Guardar los datos en localStorage para uso posterior
        localStorage.setItem('volcanoData', JSON.stringify(json));

        const so2Max = Math.max(...json.map(row => row['SO2']));
        const seismicMax = Math.max(...json.map(row => row['Actividad Sísmica']));
        const heightMax = Math.max(...json.map(row => row['Altura Máxima']));

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
            return { ...row, index: index.toFixed(2), evaluation: evaluation };
        });

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
        newRow.insertCell().innerText = row['index'];
        newRow.insertCell().innerText = row['evaluation'];
    });
}

// Función para crear el gráfico de índice compuesto
function createChart(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const labels = data.map(row => `Día ${row['Día']}`);
    const indices = data.map(row => parseFloat(row['index']));

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
    doc.text('Reporte de Actividad Volcánica', 10, 10);
    doc.setFontSize(12);
    doc.text('Aquí tienes un análisis completo de los datos volcánicos registrados.', 10, 20);

    // Añadir tabla
    const data = JSON.parse(localStorage.getItem('volcanoData'));
    let row = 30;
    doc.text('Día', 10, row);
    doc.text('Mes', 20, row);
    doc.text('Año', 30, row);
    doc.text('SO2', 40, row);
    doc.text('Actividad Sísmica', 50, row);
    doc.text('Altura Máxima', 70, row);
    doc.text('Índice Compuesto', 100, row);
    doc.text('Índice de Evaluación', 130, row);
    row += 10;

    data.forEach((item, index) => {
        doc.text(`${item['Día']}`, 10, row);
        doc.text(`${item['Mes']}`, 20, row);
        doc.text(`${item['Año']}`, 30, row);
        doc.text(`${item['SO2']}`, 40, row);
        doc.text(`${item['Actividad Sísmica']}`, 50, row);
        doc.text(`${item['Altura Máxima']}`, 70, row);
        doc.text(`${item['index']}`, 100, row);
        doc.text(`${item['evaluation']}`, 130, row);
        row += 10;
    });

    // Añadir gráfico
    html2canvas(document.getElementById('myChart')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.addImage(imgData, 'PNG', 10, 10, 180, 100);

        // Añadir comentario alegre y frase motivadora
        doc.setFontSize(16);
        doc.text('¡Buen trabajo!', 10, 120);
        doc.setFontSize(12);
        doc.text('Sigue adelante con este excelente proyecto. ¡Estás haciendo una gran diferencia!', 10, 130);
        doc.text('Frase motivadora: "El éxito es la suma de pequeños esfuerzos repetidos día tras día." - Robert Collier', 10, 140);

        // Descargar PDF
        doc.save('reporte_volcanico.pdf');
    });
}
