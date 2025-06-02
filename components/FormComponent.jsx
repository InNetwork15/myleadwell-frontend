import React, { useState, useEffect } from 'react';

const FormComponent = () => {
    const [formData, setFormData] = useState({
        field1: '',
        field2: '',
        // Add more fields as needed
    });

    useEffect(() => {
        // Load saved data from localStorage on component mount
        const savedData = JSON.parse(localStorage.getItem('formData'));
        if (savedData) {
            setFormData(savedData);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSave = () => {
        // Save data to localStorage
        localStorage.setItem('formData', JSON.stringify(formData));
        console.log('Saved data:', formData);
    };

    return (
        <form>
            <label>
                Field 1:
                <input
                    type="text"
                    name="field1"
                    value={formData.field1}
                    onChange={handleChange}
                />
            </label>
            <label>
                Field 2:
                <input
                    type="text"
                    name="field2"
                    value={formData.field2}
                    onChange={handleChange}
                />
            </label>
            <button type="button" onClick={handleSave}>
                Save
            </button>
        </form>
    );
};

export default FormComponent;
