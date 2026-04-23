import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { FullBillData, CalculatedAmounts } from '@/types/billing';
import { InvoiceSettingsData } from '@/types/invoiceSettings';
import { format } from 'date-fns';

// Register font
Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: '5mm',
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#000000',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  companyHeader: {
    textAlign: 'center',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: '8pt',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 11,
    marginBottom: 1,
  },
  companyPhone: {
    fontSize: 11,
  },
  companyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: '4pt 8pt',
    fontSize: 10,
  },
  documentTypes: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  documentType: {
    flex: 1,
    textAlign: 'center',
    padding: '6pt',
    fontWeight: 'bold',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  documentTypeLast: {
    flex: 1,
    textAlign: 'center',
    padding: '6pt',
    fontWeight: 'bold',
  },
  customerSection: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  customerDetails: {
    flex: 2,
    padding: '6pt',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  customerName: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  customerNameText: {
    fontWeight: 'bold',
  },
  customerAddress: {
    marginLeft: 24,
    fontSize: 11,
    marginBottom: 2,
  },
  customerInfo: {
    marginTop: 2,
  },
  invoiceDetails: {
    flex: 1,
    padding: '6pt',
  },
  invoiceRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  invoiceLabel: {
    width: 72,
    fontWeight: 'bold',
  },
  itemsTable: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableHeaderCell: {
    padding: '4pt',
    fontWeight: 'bold',
    fontSize: 11,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableCell: {
    padding: '4pt',
    fontSize: 11,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  srCol: { width: '8%', textAlign: 'center' },
  itemCol: { width: '32%', textAlign: 'left' },
  hsnCol: { width: '10%', textAlign: 'center' },
  qtyCol: { width: '12%', textAlign: 'right' },
  unitCol: { width: '10%', textAlign: 'center' },
  rateCol: { width: '12%', textAlign: 'right' },
  amountCol: { width: '16%', textAlign: 'right', borderRightWidth: 0 },
  totalsSection: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    borderTopWidth: 0,
  },
  totalsRow: {
    flexDirection: 'row',
  },
  totalEmptyCell: {
    width: '60%',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  totalsLabel: {
    width: '20%',
    padding: '4pt',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  totalsValue: {
    width: '20%',
    padding: '4pt',
    textAlign: 'right',
  },
  amountInWords: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: '4pt 8pt',
    fontWeight: 'medium',
  },
  bankDetails: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    padding: '4pt 6pt',
  },
  bankLabel: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bankInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  bankCol: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  termsSection: {
    width: '65%',
    padding: '6pt',
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  termsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  termsList: {
    fontSize: 10,
  },
  signatureSection: {
    width: '35%',
    padding: '6pt',
    textAlign: 'center',
  },
  signatureCompany: {
    fontWeight: 'bold',
    marginBottom: 36,
  },
  signatureLine: {
    width: '60%',
    marginHorizontal: 'auto',
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 2,
  },
});

interface PdfInvoiceProps {
  data: FullBillData;
}

const defaultCalculatedAmounts: CalculatedAmounts = {
  subTotalBeforeDiscount: 0,
  discountApplied: 0,
  taxableAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  totalTaxAmount: 0,
  grandTotal: 0,
  amountInWords: 'Zero'
};

const defaultInvoiceSettings: Partial<InvoiceSettingsData> = {
  showCompanyGSTIN: true,
  showCompanyPAN: true,
  showCompanyPhone: true,
  showCompanyStateAndCode: true,
  showCustomerGSTIN: true,
  showCustomerPAN: true,
  showCustomerStateAndCode: true,
  showHSNCodeColumn: true,
  showBankDetailsSection: true,
  showTermsAndConditionsSection: true
};

const defaultCompanyDetails = {
  name: 'SHREE HARI HAND WORK',
  address: '735 2ND FLOOR NEW GIDC KATAR GAM SURAT',
  phone: '',
  gstin: '',
  pan: '',
  state: '',
  stateCode: '',
  email: ''
};

const defaultBillTo = {
  name: '',
  address: '',
  gstin: '',
  state: '',
  stateCode: '',
  pan: ''
};

const defaultInvoiceDetails = {
  invoiceNumber: '',
  date: null
};

const PdfInvoice: React.FC<PdfInvoiceProps> = ({ data }) => {
  // Add validation to ensure data is not null/undefined
  if (!data) {
    return (
      <Page size="A4" style={styles.page}>
        <Text>Error: No data provided</Text>
      </Page>
    );
  }

  const {
    companyDetails = defaultCompanyDetails,
    billTo = defaultBillTo,
    invoiceDetails = defaultInvoiceDetails,
    items = [],
    calculatedAmounts = defaultCalculatedAmounts,
    bankDetails = {},
    gstSettings = {},
    discountPercentage = 0,
    termsAndConditions = '',
    invoiceDisplaySettings = defaultInvoiceSettings,
  } = data;

  const {
    subTotalBeforeDiscount,
    discountApplied,
    cgstAmount,
    sgstAmount,
    grandTotal,
    amountInWords
  } = calculatedAmounts;

  const TOTAL_ITEM_ROWS = 12;
  const displayItems = items.slice(0, TOTAL_ITEM_ROWS);
  const emptyRowsCount = Math.max(0, TOTAL_ITEM_ROWS - displayItems.length);

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

  return (
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{companyDetails.name || 'SHREE HARI HAND WORK'}</Text>
          <Text style={styles.companyAddress}>{companyDetails.address || '735 2ND FLOOR NEW GIDC KATAR GAM SURAT'}</Text>
          {showCompanyPhone && companyDetails.phone && (
            <Text style={styles.companyPhone}>Mob.{companyDetails.phone}</Text>
          )}
        </View>

        {/* Company Details */}
        <View style={styles.companyDetails}>
          {showCompanyGSTIN && <Text>GSTIN No. : {companyDetails.gstin || 'N/A'}</Text>}
          {showCompanyStateAndCode && (
            <>
              <Text>State : {companyDetails.state || 'N/A'}</Text>
              <Text>State Code : {companyDetails.stateCode || 'N/A'}</Text>
            </>
          )}
          {showCompanyPAN && <Text>PAN No. : {companyDetails.pan || 'N/A'}</Text>}
        </View>

        {/* Document Types */}
        <View style={styles.documentTypes}>
          <Text style={styles.documentType}>Debit Memo</Text>
          <Text style={styles.documentType}>Tax Invoice</Text>
          <Text style={styles.documentTypeLast}>ORIGINAL</Text>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <View style={styles.customerDetails}>
            <View style={styles.customerName}>
              <Text style={styles.customerNameText}>M/s. </Text>
              <Text style={styles.customerNameText}>{billTo.name}</Text>
            </View>
            <Text style={styles.customerAddress}>{billTo.address}</Text>
            <View style={styles.customerInfo}>
              {showCustomerGSTIN && (
                <Text>GSTIN No. : {billTo.gstin || 'N/A'}</Text>
              )}
              {showCustomerStateAndCode && (
                <Text>Place of Supply : {placeOfSupplyDisplay}</Text>
              )}
              {showCustomerPAN && (
                <Text>PAN No. : {billTo.pan || 'N/A'}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice No.</Text>
              <Text>: {invoiceDetails.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice Date</Text>
              <Text>: {
                invoiceDetails.date ? 
                  (invoiceDetails.date instanceof Date ? 
                    format(invoiceDetails.date, 'dd/MM/yyyy') : 
                    format(new Date(invoiceDetails.date), 'dd/MM/yyyy')
                  ) : 'N/A'
              }</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.srCol]}>Sr.</Text>
            <Text style={[styles.tableHeaderCell, styles.itemCol]}>Particular</Text>
            {showHSNCodeColumn && (
              <Text style={[styles.tableHeaderCell, styles.hsnCol]}>HSNCode</Text>
            )}
            <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Meter</Text>
            <Text style={[styles.tableHeaderCell, styles.unitCol]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.rateCol]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.amountCol]}>Amount</Text>
          </View>

          {displayItems.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.srCol]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.itemCol]}>{item.description}</Text>
              {showHSNCodeColumn && (
                <Text style={[styles.tableCell, styles.hsnCol]}>{item.hsnCode}</Text>
              )}
              <Text style={[styles.tableCell, styles.qtyCol]}>
                {item.quantity?.toFixed(3) ?? ''}
              </Text>
              <Text style={[styles.tableCell, styles.unitCol]}>{item.unit || 'Mtr.'}</Text>
              <Text style={[styles.tableCell, styles.rateCol]}>
                {(item.rate ?? 0).toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCol]}>
              {((item.quantity || 0) * (item.rate || 0)).toFixed(2)}
              </Text>
            </View>
          ))}

          {Array.from({ length: emptyRowsCount }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.srCol]}>&nbsp;</Text>
              <Text style={[styles.tableCell, styles.itemCol]}></Text>
              {showHSNCodeColumn && <Text style={[styles.tableCell, styles.hsnCol]}></Text>}
              <Text style={[styles.tableCell, styles.qtyCol]}></Text>
              <Text style={[styles.tableCell, styles.unitCol]}></Text>
              <Text style={[styles.tableCell, styles.rateCol]}></Text>
              <Text style={[styles.tableCell, styles.amountCol]}></Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <View style={styles.totalEmptyCell}></View>
            <Text style={styles.totalsLabel}>Sub Total</Text>
            <Text style={styles.totalsValue}>{subTotalBeforeDiscount.toFixed(2)}</Text>
          </View>

          {discountApplied > 0 && (
            <View style={styles.totalsRow}>
              <View style={styles.totalEmptyCell}></View>
              <Text style={styles.totalsLabel}>
                Discount {discountPercentage != null && discountPercentage > 0 ? 
                  `${(discountPercentage ?? 0).toFixed(2)} %` : ''}
              </Text>
              <Text style={styles.totalsValue}>{discountApplied.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.totalsRow}>
            <View style={styles.totalEmptyCell}></View>
            <Text style={styles.totalsLabel}>
              CGST {(gstSettings?.cgstRate ?? 0).toFixed(2)} %
            </Text>
            <Text style={styles.totalsValue}>{cgstAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.totalsRow}>
            <View style={styles.totalEmptyCell}></View>
            <Text style={styles.totalsLabel}>
              SGST {(gstSettings?.sgstRate ?? 0).toFixed(2)} %
            </Text>
            <Text style={styles.totalsValue}>{sgstAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.totalsRow}>
            <View style={styles.totalEmptyCell}></View>
            <Text style={[styles.totalsLabel, { fontWeight: 'bold' }]}>Grand Total</Text>
            <Text style={[styles.totalsValue, { fontWeight: 'bold' }]}>
              {grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text>Rs. In Words : {amountInWords}</Text>
        </View>

        {/* Bank Details */}
        {showBankDetailsSection && (
          <View style={styles.bankDetails}>
            <Text style={styles.bankLabel}>Our Bank Detail :</Text>
            {(bankDetails?.bankName || bankDetails?.accountNumber || 
              bankDetails?.branchName || bankDetails?.ifscCode) ? (
              <View style={styles.bankInfo}>
                <View style={styles.bankCol}>
                  {bankDetails?.bankName && (
                    <Text>Bank : {bankDetails.bankName}</Text>
                  )}
                  {bankDetails?.accountNumber && (
                    <Text>A/c No. : {bankDetails.accountNumber}</Text>
                  )}
                </View>
                <View style={styles.bankCol}>
                  {bankDetails?.branchName && (
                    <Text>Branch : {bankDetails.branchName}</Text>
                  )}
                  {bankDetails?.ifscCode && (
                    <Text>NEFT / IFS Code : {bankDetails.ifscCode}</Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={{ fontStyle: 'italic' }}>(Bank details not provided)</Text>
            )}
          </View>
        )}

        {/* Footer - Terms and Signature */}
        <View style={styles.footer}>
          {showTermsAndConditionsSection && (
            <View style={styles.termsSection}>
              <Text style={styles.termsHeader}>Terms & Conditions</Text>
              {termsAndConditions && (
                <View style={styles.termsList}>
                  {termsAndConditions.split('\n').map((term, index) => 
                    term.trim() && (
                      <Text key={index}>{term.trim()}</Text>
                    )
                  )}
                </View>
              )}
            </View>
          )}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureCompany}>
              For, {companyDetails.name || 'SHREE HARI HAND WORK'}
            </Text>
            <View style={styles.signatureLine} />
            <Text>Authorised Signatory</Text>
          </View>
        </View>
      </Page>
  );
};

export default PdfInvoice; 