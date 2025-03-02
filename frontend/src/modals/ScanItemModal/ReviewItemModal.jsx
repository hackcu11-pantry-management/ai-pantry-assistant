/** @module ReviewItemModal */

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toggleModal } from "../../redux/actions/modalActions";
import Modal from "../../common/Modal/Modal";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ReviewItemModal = ({ productData }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: productData?.title || "",
    amount: 1,
    purchaseDate: new Date(),
    expiryDate: productData?.expiryDate ? new Date(productData.expiryDate) : null,
    category: productData?.category || "",
  });

  const handleClose = () => {
    dispatch(toggleModal("reviewItemModal"));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // TODO: Add to pantry logic will go here
    console.log("Submitting item:", formData);
    handleClose();
  };

  return (
    <Modal
      modal_id="reviewItemModal"
      title="Review Scanned Item"
      footerButtons={[
        {
          text: "Cancel",
          variant: "outlined",
          onClick: handleClose,
        },
        {
          text: "Add to Pantry",
          variant: "contained",
          onClick: handleSubmit,
        },
      ]}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Stack spacing={2}>
          <Box>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Box>
          
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
            />
            
            <FormControl fullWidth>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
              >
                <MenuItem value="Fruits & Vegetables">Fruits & Vegetables</MenuItem>
                <MenuItem value="Meat & Seafood">Meat & Seafood</MenuItem>
                <MenuItem value="Dairy & Eggs">Dairy & Eggs</MenuItem>
                <MenuItem value="Bread & Bakery">Bread & Bakery</MenuItem>
                <MenuItem value="Pantry Staples">Pantry Staples</MenuItem>
                <MenuItem value="Snacks">Snacks</MenuItem>
                <MenuItem value="Beverages">Beverages</MenuItem>
                <MenuItem value="Frozen Foods">Frozen Foods</MenuItem>
                <MenuItem value="Canned Goods">Canned Goods</MenuItem>
                <MenuItem value="Condiments & Sauces">Condiments & Sauces</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Purchase Date"
              value={formData.purchaseDate}
              onChange={(newValue) => handleDateChange('purchaseDate', newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            
            <DatePicker
              label="Expiry Date"
              value={formData.expiryDate}
              onChange={(newValue) => handleDateChange('expiryDate', newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>
        </Stack>
      </LocalizationProvider>
    </Modal>
  );
};

export default ReviewItemModal; 