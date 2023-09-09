const { PrismaClient } = require('@prisma/client');
const { get } = require('prompt');
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
        return divisions;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getUpazillas() {
    try {
        const upazillas = await prisma.correction_upazilla.findMany();
        return upazillas;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getUpazillasOfDistrict(district_ids) {
    if (district_ids.length == 0) {
        return getUpazillas();
    }
    try {
        const upazilla = await prisma.correction_upazilla.findMany({
            where: {
                district_id: {
                    in: district_ids
                }
            }
        });
        // console.log(upazilla);
        return upazilla;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getThanas() {
    try {
        const thanas = await prisma.correction_thana.findMany();
        return thanas;
    }
    catch (error) {
        console.error('Error:', error);
    }
}


async function getThanasOfDistrict(district_ids) {
    if (district_ids.length == 0) {
        return getThanas();
    }
    try {
        const thana = await prisma.correction_thana.findMany({
            where: {
                district_id: {
                    in: district_ids
                }
            }
        });
        return thana;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getCitycorporations() {
    try {
        const citycorporations = await prisma.correction_citycorporation.findMany();
        return citycorporations;
    }
    catch (error) {
        console.error('Error:', error);
    }
}


async function getCitycorporationsOfDistrict(district_ids) {
    if (district_ids.length == 0) {
        return getCitycorporations();
    }
    try {
        const citycorporation = await prisma.correction_citycorporation.findMany({
            where: {
                district_id: {
                    in: district_ids
                }
            }
        });
        return citycorporation;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getPaurashavas() {
    try {
        const paurashavas = await prisma.correction_paurashava.findMany();
        return paurashavas;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getPaurashavasOfDistrict(district_ids) {
    if (district_ids.length == 0) {
        return getPaurashavas();
    }
    try {
        const paurashava = await prisma.correction_paurashava.findMany({
            where: {
                district_id: {
                    in: district_ids
                }
            }
        });
        return paurashava;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getPostoffices() {
    try {
        const postoffices = await prisma.correction_postoffice.findMany();
        return postoffices;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getPostofficesOfDistrict(district_ids) {
    if (district_ids.length == 0) {
        return getPostoffices();
    }
    try {
        const postoffice = await prisma.correction_postoffice.findMany({
            where: {
                district_id: {
                    in: district_ids
                }
            }
        });
        return postoffice;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getUnions() {
    try {
        const unions = await prisma.correction_union.findMany();
        return unions;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getUnionsOfUpazilla(upazilla_ids) {
    if (upazilla_ids.length == 0) {
        return getUnions();
    }
    try {
        const union = await prisma.correction_union.findMany({
            where: {
                upazilla_id: {
                    in: upazilla_ids
                }
            }
        });
        return union;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getMaxWardOfCitycorporation(citycorporation_id) {
    if (citycorporation_ids.length == 0) {
        return 0;
    }
    try {
        const max_wards = await prisma.correction_citycorporation.findFirst({
            where: {
                id: citycorporation_id
            },
            select: {
                max_wardnumber: true
            }
        });
        return max_wards;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getMaxWardOfPaurashava(paurashava_id) {
    if (paurashava_ids.length == 0) {
        return 0;
    }
    try {
        const max_wards = await prisma.correction_paurashava.findFirst({
            where: {
                id: paurashava_id
            },
            select: {
                max_wardnumber: true
            }
        });
        return max_wards;
    }
    catch (error) {
        console.error('Error:', error);
    }
}

async function getPostCodeOfPostoffice(postoffice_id) {
    try {
        const post_code = await prisma.correction_postoffice.findFirst({
            where: {
                id: postoffice_id
            },
            select: {
                post_code: true
            }
        });
        return post_code;
    }
    catch (error) {
        console.error('Error:', error);
    }
}




module.exports = {
    getDistrictsInDivision,
    getDistricts,
    getDivisions,
    getUpazillasOfDistrict,
    getThanasOfDistrict,
    getCitycorporationsOfDistrict,
    getPaurashavasOfDistrict,
    getPostofficesOfDistrict,
    getUnionsOfUpazilla,
    getMaxWardOfCitycorporation,
    getMaxWardOfPaurashava,
    getPostCodeOfPostoffice
}