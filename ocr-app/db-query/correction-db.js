const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function getDistrictsInDivision(division_id) {
    try {
        const districts = await prisma.correction_district.findMany({
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
        const districts = await prisma.correction_district.findMany();
        return districts;
    }
    catch (error) {
        console.error('Error:', error);
    }
}



async function getDivisions() {
    try {
        const divisions = await prisma.correction_division.findMany();
        console.log(divisions)
        return divisions;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getUpazillas() {
    try {
        const upazilla = await prisma.correction_upazilla.findMany();
        return upazilla;
    }
    catch (error) {
        console.error('Error:', error);
    }
}


module.exports = {
    getDistrictsInDivision,
    getDistricts,
    getDivisions,
    getUpazillas,
}