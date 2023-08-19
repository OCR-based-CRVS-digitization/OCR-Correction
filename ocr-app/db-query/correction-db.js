const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function getDistrictsInDivision(division_id) {
    try {
        const districts = await prisma.district.findMany({
            where: {
                division_id: division_id
            }
        });
        return districts;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getDistricts() {
    try {
        const districts = await prisma.district.findMany();
        console.log(districts)
        return districts;
    }
    catch (error) {
        console.error('Error:', error);
    }
}



async function getDivisions() {
    try {
        const divisions = await prisma.division.findMany();
        console.log(divisions)
        return divisions;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
    getDistrictsInDivision,
    getDistricts,
    getDivisions
}