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

        // Obtener valores máximos introducidos por el usuario
        const so2Max = parseFloat(document.getElementById('so2Max').value);
        const seismicMax = parseFloat(document.getElementById('seismicMax').value);
        const heightMax = parseFloat(document.getElementById('heightMax').value);

        if (isNaN(so2Max) || isNaN(seismicMax) || isNaN(heightMax)) {
            alert("Por favor, ingresa todos los valores máximos.");
            return;
        }

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
        generateSummary(results);
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
                borderColor: indices.map(value => {
                    if (value < 0.4) return 'green';
                    if (value < 0.6) return 'yellow';
                    if (value < 0.8) return 'orange';
                    return 'red';
                }),
                borderWidth: 2,
                fill: false,
                tension: 0.1
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

// Función para generar el resumen
function generateSummary(results) {
    const summaryElement = document.getElementById('analysis-summary');
    summaryElement.innerHTML = '';
    const daysWithCriticalEruption = results.filter(row => row.evaluation === 'Erupción crítica');
    const daysWithHighActivity = results.filter(row => row.evaluation.includes('Aumento') || row.evaluation.includes('Incremento'));
    
    let summaryText = '';
    if (daysWithCriticalEruption.length > 0) {
        summaryText += `Días con erupción crítica: ${daysWithCriticalEruption.map(row => row['Día']).join(', ')}.<br>`;
    } else {
        summaryText += 'No hubo días con erupción crítica.<br>';
    }

    if (daysWithHighActivity.length > 0) {
        summaryText += `Días con incremento de actividad: ${daysWithHighActivity.map(row => row['Día']).join(', ')}.<br>`;
    } else {
        summaryText += 'No hubo días con incremento de actividad significativa.<br>';
    }

    summaryText += '¡Sigue monitoreando para mantenerte informado!';

    summaryElement.innerHTML = summaryText;
}

// Función para generar el PDF
function generatePDF() {
    const element = document.getElementById('result');
    const options = {
        margin: 0.5,
        filename: 'informe_volcanico.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(options).save();
}
