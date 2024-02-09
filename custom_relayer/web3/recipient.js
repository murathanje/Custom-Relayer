import { ethers } from "ethers";
import abi from '../abi/Recipient.json';

export function createRecipientInstance(provider) {
    return new ethers.Contract(address, abi, provider);
}