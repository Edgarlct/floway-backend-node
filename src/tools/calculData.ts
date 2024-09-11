
export function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
}


export function calculateTotalDistance(positions) {
    let totalDistance = 0;

    for (let i = 1; i < positions.length; i++) {
        const [lat1, lon1] = positions[i - 1];
        const [lat2, lon2] = positions[i];

        const distance = haversine(lat1, lon1, lat2, lon2);
        totalDistance += distance;
    }

    return totalDistance;
}


export function calculateAverageSpeed(positions) {
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < positions.length; i++) {
        const [lat1, lon1, t1] = positions[i - 1];
        const [lat2, lon2, t2] = positions[i];

        const distance = haversine(lat1, lon1, lat2, lon2);
        const timeDiff = t2 - t1;

        totalDistance += distance;
        totalTime += timeDiff;
    }

    if (totalTime === 0) return 0;

    const averageSpeed = totalDistance / (totalTime / 3600);
    return averageSpeed;
}


export function calculateTotalDuration(positions) {
    if (positions.length < 2) return 0;

    const startTime = positions[0][2];
    const endTime = positions[positions.length - 1][2];
    return endTime - startTime;
}