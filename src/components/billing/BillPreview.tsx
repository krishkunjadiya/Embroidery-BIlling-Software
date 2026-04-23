'use client';

import React from 'react';
import type { FullBillData } from '@/types/billing';
import { formatCurrency } from '@/lib/billing-utils';
import { format } from 'date-fns';

interface BillPreviewProps {
  data: FullBillData;
}

const BillPreview: React.FC<BillPreviewProps> = ({ data }) => {
  const {
    companyDetails,
    billTo,
    invoiceDetails,
    items,
    calculatedAmounts,
    bankDetails,
    gstSettings,
    discountPercentage,
    termsAndConditions,
    invoiceDisplaySettings,
  } = data;

  const {
    subTotalBeforeDiscount,
    discountApplied,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    grandTotal,
    amountInWords
  } = calculatedAmounts;

  const TOTAL_ITEM_ROWS = 12;
  const displayItems = items.slice(0, TOTAL_ITEM_ROWS);
  const emptyRowsCount = Math.max(0, TOTAL_ITEM_ROWS - displayItems.length);

  // Determine visibility based on settings, defaulting to true if settings are undefined
  const showCompanyGSTIN = invoiceDisplaySettings?.showCompanyGSTIN ?? true;
  const showCompanyPAN = invoiceDisplaySettings?.showCompanyPAN ?? true;
  const showCompanyPhone = invoiceDisplaySettings?.showCompanyPhone ?? true;
  const showCompanyStateAndCode = invoiceDisplaySettings?.showCompanyStateAndCode ?? true;

  const showCustomerGSTIN = invoiceDisplaySettings?.showCustomerGSTIN ?? true;
  const showCustomerPAN = invoiceDisplaySettings?.showCustomerPAN ?? true;
  const showCustomerStateAndCode = invoiceDisplaySettings?.showCustomerStateAndCode ?? true;
  
  const showHSNCodeColumn = invoiceDisplaySettings?.showHSNCodeColumn ?? true;
  const showBankDetailsSection = invoiceDisplaySettings?.showBankDetailsSection ?? true;
  const showTermsAndConditionsSection = invoiceDisplaySettings?.showTermsAndConditionsSection ?? true;

  const placeOfSupplyDisplay = (billTo.stateCode && billTo.state)
    ? `${billTo.stateCode} - ${billTo.state}`
    : (billTo.state || billTo.stateCode || 'N/A');

  // Calculate colspan for the "Rs. In Words" row dynamically
  let numberOfHeaderCells = 6; // Sr, Particular, Meter, Unit, Rate, Amount
  if (showHSNCodeColumn) numberOfHeaderCells++;

  return (
    <div className="printable-area-content bg-white text-black border border-black font-['Arial'] text-[11pt]">
      {/* Main table that contains the entire bill layout */}
      <table className="w-full border-collapse">
        <tbody>
          {/* Company Header Row */}
          <tr>
            <td colSpan={3} className="border border-black py-2 px-3 align-top">
              <div className="text-center">
                <h1 className="text-[16pt] font-bold m-0 mb-1">{companyDetails.name || 'SHREE HARI HAND WORK'}</h1>
                <p className="m-0 leading-tight">{companyDetails.address || '735 2ND FLOOR NEW GIDC KATAR GAM SURAT'}</p>
                {showCompanyPhone && companyDetails.phone && <p className="m-0 leading-tight">Mob.{companyDetails.phone}</p>}
              </div>
            </td>
          </tr>

          {/* Company Details Row */}
          <tr>
            <td colSpan={3} className="border border-black py-1 px-3 align-top">
              <div className="flex justify-between items-start gap-2">
                {showCompanyGSTIN && <span className="text-[10pt]">GSTIN No. : {companyDetails.gstin || 'N/A'}</span>}
                {showCompanyStateAndCode && <>
                  <span className="text-[10pt]">State : {companyDetails.state || 'N/A'}</span>
                  <span className="text-[10pt]">State Code : {companyDetails.stateCode || 'N/A'}</span>
                </>}
                {showCompanyPAN && <span className="text-[10pt]">PAN No. : {companyDetails.pan || 'N/A'}</span>}
              </div>
            </td>
          </tr>

          {/* Document Type Row */}
          <tr>
            <td className="border border-black p-2 text-center font-bold w-1/3 align-top">Debit Memo</td>
            <td className="border border-black p-2 text-center font-bold w-1/3 align-top">Tax Invoice</td>
            <td className="border border-black p-2 text-center font-bold w-1/3 align-top">ORIGINAL</td>
          </tr>

          {/* Customer & Invoice Details Row */}
          <tr>
            <td colSpan={2} className="border border-black py-2 px-2 align-top">
              <div className="flex flex-col gap-0">
                <div className="flex mb-0.5">
                  <span className="font-bold">M/s.</span>
                  <span className="font-bold ml-2">{billTo.name}</span>
                </div>
                <p className="ml-8 whitespace-pre-line m-0 leading-tight">{billTo.address}</p>
                <div className="mt-0.5 space-y-0">
                  {showCustomerGSTIN && <p className="m-0 leading-tight">GSTIN No. : {billTo.gstin || 'N/A'}</p>}
                  {showCustomerStateAndCode && <p className="m-0 leading-tight">Place of Supply : {placeOfSupplyDisplay}</p>}
                  {showCustomerPAN && <p className="m-0 leading-tight">PAN No. : {billTo.pan || 'N/A'}</p>}
                </div>
              </div>
            </td>
            <td className="border border-black py-2 px-2 align-top">
              <div className="flex flex-col gap-1">
                <div className="flex">
                  <span className="font-bold w-24">Invoice No.:</span>
                  <span className="flex-1">{invoiceDetails.invoiceNumber}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24">Invoice Date :</span>
                  <span className="flex-1">{
                    invoiceDetails.date ? 
                      (invoiceDetails.date instanceof Date ? 
                        format(invoiceDetails.date, 'dd/MM/yyyy') : 
                        format(new Date(invoiceDetails.date), 'dd/MM/yyyy')
                      ) : 'N/A'
                  }</span>
                </div>
              </div>
            </td>
          </tr>

          {/* Items Table Row */}
          <tr>
            <td colSpan={3} className="border border-black p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f0f0f0]">
                    <th className="border border-black p-1 text-center w-10 font-bold align-top">Sr.</th>
                    <th className="border border-black p-1 text-left font-bold align-top">Particular</th>
                    {showHSNCodeColumn && <th className="border border-black p-1 text-center w-24 font-bold align-top">HSNCode</th>}
                    <th className="border border-black p-1 text-center w-24 font-bold align-top">Meter</th>
                    <th className="border border-black p-1 text-center w-16 font-bold align-top">Unit</th>
                    <th className="border border-black p-1 text-right w-24 font-bold align-top">Rate</th>
                    <th className="border border-black p-1 text-right w-28 font-bold align-top">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, index) => (
                    <tr key={item.id} className="leading-tight">
                      <td className="border border-black py-1.5 px-1 text-center align-top">{index + 1}</td>
                      <td className="border border-black py-1.5 px-2 align-top">{item.description}</td>
                      {showHSNCodeColumn && <td className="border border-black py-1.5 px-1 text-center align-top">{item.hsnCode}</td>}
                      <td className="border border-black py-1.5 px-2 text-right align-top">{item.quantity?.toFixed(3) ?? ''}</td>
                      <td className="border border-black py-1.5 px-1 text-center align-top">{item.unit || 'Mtr.'}</td>
                      <td className="border border-black py-1.5 px-2 text-right align-top">{(item.rate ?? 0).toFixed(2)}</td>
                      <td className="border border-black py-1.5 px-2 text-right align-top">{(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRowsCount }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border border-black py-1.5 px-1 align-top">&nbsp;</td>
                      <td className="border border-black py-1.5 px-1 align-top"></td>
                      {showHSNCodeColumn && <td className="border border-black py-1.5 px-1 align-top"></td>}
                      <td className="border border-black py-1.5 px-1 align-top"></td>
                      <td className="border border-black py-1.5 px-1 align-top"></td>
                      <td className="border border-black py-1.5 px-1 align-top"></td>
                      <td className="border border-black py-1.5 px-1 align-top"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>

          {/* Amounts and Calculations Row */}
          <tr>
            <td colSpan={3} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black py-0.5 px-1 w-2/3 align-top"></td>
                    <td className="border-r border-black py-0.5 px-1 w-1/6 text-left align-top">Sub Total</td>
                    <td className="py-0.5 px-1 w-1/6 text-right align-top">{subTotalBeforeDiscount.toFixed(2)}</td>
                  </tr>
                  {discountApplied > 0 && (
                    <tr>
                      <td className="border-r border-black py-0.5 px-1 align-top"></td>
                      <td className="border-r border-black py-0.5 px-1 text-left align-top">Discount {discountPercentage != null && discountPercentage > 0 ? `${(discountPercentage ?? 0).toFixed(2)} %` : ''}</td>
                      <td className="py-0.5 px-1 text-right align-top">{discountApplied.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="border-r border-black py-0.5 px-1 align-top"></td>
                    <td className="border-r border-black py-0.5 px-1 text-left align-top">CGST {(gstSettings?.cgstRate ?? 0).toFixed(2)} %</td>
                    <td className="py-0.5 px-1 text-right align-top">{cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black py-0.5 px-1 align-top"></td>
                    <td className="border-r border-black py-0.5 px-1 text-left align-top">SGST {(gstSettings?.sgstRate ?? 0).toFixed(2)} %</td>
                    <td className="py-0.5 px-1 text-right align-top">{sgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t border-black">
                    <td className="border-r border-black py-0.5 px-1 align-top"></td>
                    <td className="border-r border-black py-0.5 px-1 text-left font-bold align-top">Grand Total</td>
                    <td className="py-0.5 px-1 text-right font-bold align-top">{grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Amount in Words Row */}
          <tr>
            <td colSpan={3} className="border border-black py-1 px-3">
              <span className="font-semibold">Rs. In Words : {amountInWords}</span>
            </td>
          </tr>

          {/* Bank Details Row */}
          {showBankDetailsSection && (
            <tr>
              <td colSpan={3} className="border border-black py-1 px-2 align-top">
                <div className="flex">
                  <span className="font-bold whitespace-nowrap mr-2">Our Bank Detail :</span>
                  {(bankDetails?.bankName || bankDetails?.accountNumber || bankDetails?.branchName || bankDetails?.ifscCode) ? (
                    <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0">
                      <div className="leading-tight">
                        {bankDetails?.bankName && <div className="m-0">Bank : {bankDetails.bankName}</div>}
                        {bankDetails?.accountNumber && <div className="m-0">A/c No. : {bankDetails.accountNumber}</div>}
                      </div>
                      <div className="leading-tight">
                        {bankDetails?.branchName && <div className="m-0">Branch : {bankDetails.branchName}</div>}
                        {bankDetails?.ifscCode && <div className="m-0">NEFT / IFS Code : {bankDetails.ifscCode}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="italic ml-1">(Bank details not provided)</div>
                  )}
                </div>
              </td>
            </tr>
          )}

          {/* Terms and Signature Row */}
          <tr>
            <td colSpan={3} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {showTermsAndConditionsSection && (
                      <td className="border-r border-black py-2 px-2 align-top w-2/3">
                        <h3 className="font-bold text-[12pt] m-0 mb-1">Terms & Conditions</h3>
                        {termsAndConditions && (
                          <ul className="list-none p-0 m-0 space-y-0">
                            {termsAndConditions.split('\n').map((term, index) => term.trim() && (
                              <li key={index} className="text-[10pt] leading-tight">{term.trim()}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    )}
                    <td className={showTermsAndConditionsSection ? "py-2 px-2 text-center w-1/3" : "py-2 px-2 text-center"}>
                      <p className="font-bold m-0">For, {companyDetails.name || 'SHREE HARI HAND WORK'}</p>
                      <div className="h-12"></div>
                      <p className="border-t border-black inline-block px-6 pt-1 m-0">Authorised Signatory</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BillPreview;
