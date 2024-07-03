public class FetchRecordsFromObjects {
    public class QueryResult {
        @AuraEnabled
        public String sObjectType { get; set; }
        @AuraEnabled
        public List<SObject> records { get; set; }
        
        public QueryResult(String sObjectType, List<SObject> records) {
            this.sObjectType = sObjectType;
            this.records = records;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<QueryResult> fetchRecords(List<String> objectNames) {
        List<QueryResult> results = new List<QueryResult>();
        
        for (String objectName : objectNames) {
            Integer recordCount = 0;
            List<SObject> records = new List<SObject>();
            
            try {
                // Construct the count query
                String countQuery = 'SELECT COUNT() FROM ' + objectName;
                
                // Execute the count query using Database.countQuery()
                recordCount = Database.countQuery(countQuery);
                
                // If there are records, retrieve up to 100 records with all fields
                if (recordCount > 0) {
                    // Get the describe result for the object
                    Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
                    if (sObjectType != null) {
                        Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
                        Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
                        
                        // Build the query with all fields
                        String query = 'SELECT ';
                        List<String> fieldList = new List<String>();
                        for (String fieldName : fieldMap.keySet()) {
                            fieldList.add(fieldName);
                        }
                        query += String.join(fieldList, ', ') + ' FROM ' + objectName + ' LIMIT 100';
                        
                        // Execute the query
                        records = Database.query(query);
                    }
                }
                
            } catch (Exception e) {
                System.debug('Error fetching records for object: ' + objectName + ' - ' + e.getMessage());
                continue;
            }
            
            results.add(new QueryResult(objectName, records));
        }
        
        return results;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<String> getObjectNames() {
        List<String> objectNames = new List<String>();
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        
        for (String objectName : globalDescribe.keySet()) {
            objectNames.add(objectName);
        }
        
        objectNames.sort();

        return objectNames;
    }
}
