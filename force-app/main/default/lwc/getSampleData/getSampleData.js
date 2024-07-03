import { LightningElement, track, wire } from 'lwc';
import getObjectNames from '@salesforce/apex/FetchRecordsFromObjects.getObjectNames';
import fetchRecords from '@salesforce/apex/FetchRecordsFromObjects.fetchRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class GetSampleData extends LightningElement {
    @track objectOptions = [];
    @track selectedObjects = [];
    results = [];

    @wire(getObjectNames)
    wiredObjectNames({ error, data }) {
        if (data) {
            this.objectOptions = data.map(objectName => {
                return { label: objectName, value: objectName };
            });
        } else if (error) {
            console.error('Error fetching object names:', error);
        }
    }

    handleObjectChange(event) {
        this.selectedObjects = event.detail.value;
        console.log(this.selectedObjects);
    }

    async handleSubmit() {
        window.alert(this.selectedObjects);
        await fetchRecords({ objectNames: this.selectedObjects })
            .then(result => {
                this.results = result;
                console.log(result);
                this.downloadCSV(result);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Sample Data Extracted Successfully',
                    variant: 'success'
                }));
            })
            .catch(error => {
                console.error('Error fetching selected objects:', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Extraction Failed',
                    message: 'Please contact Salesforce Admin',
                    variant: 'destructive'
                }));
            });
        this.dispatchEvent(new ShowToastEvent({
            title: 'Process Ended',
            variant: 'success'
        }));
    }

    downloadCSV(queryResults) {
        if (!queryResults || queryResults.length === 0) {
            return;
        }

        queryResults.forEach(queryResult => {
            if (queryResult.records && queryResult.records.length > 0) {
                let headers = Object.keys(queryResult.records[0]);
                let csvRows = [];

                queryResult.records.forEach(record => {
                    let row = headers.map(header => {
                        let cell = record[header] === undefined ? '' : record[header];
                        return `"${cell.toString().replace(/"/g, '""')}"`; // Escape quotes
                    });
                    csvRows.push(row.join(','));
                });

                // Create CSV content
                let csvContent = headers.join(',') + '\n' + csvRows.join('\n');

                // Create a Blob from the CSV content
                const blob = new Blob([csvContent], { type: 'text/plain' });

                // Check if Blob creation is successful
                if (blob) {
                    // Create a link element and trigger the download
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${queryResult.sObjectType}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url); // Clean up
                    document.body.removeChild(a);
                } else {
                    console.error('Failed to create Blob for CSV download.');
                }
            }
        });
    }
}
