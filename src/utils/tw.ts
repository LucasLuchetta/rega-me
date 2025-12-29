import { create } from 'twrnc';

// Importing the configuration to ensure we share the same source of truth
const tw = create(require('../../tailwind.config.js'));

export default tw;
