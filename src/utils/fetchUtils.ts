export async function fetchAllRecords(queryBuilder: any): Promise<any[]> {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    
    while (true) {
        const { data, error } = await queryBuilder.range(from, from + step - 1);
        
        if (error) {
            console.error('Error fetching all records:', error);
            throw error;
        }
        
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        
        if (data.length < step) break;
        
        from += step;
    }
    
    return allData;
}
