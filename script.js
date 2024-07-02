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
    const indices = data.map(row => parseFloat(row.index));

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
