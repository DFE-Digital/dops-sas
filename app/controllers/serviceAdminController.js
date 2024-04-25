const knexConfig = require('../../knexfile'); // Adjust the path as necessary
const knex = require('knex')(knexConfig.development); // Use the correct environment (development, production, etc.)


exports.g_createDepartment = (req, res) => {
    res.render('service-admin/create-department');
}   

exports.p_createDepartment = async (req, res) => {
    const { Name, Domain, SelfRegistrationAllowed } = req.body;

    try {
        const newDepartment = await knex('Department').insert({
            Name,
            Domain,
            SelfRegistrationAllowed
        });

        res.status(201).json(newDepartment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};