// Admin-specific functionality
class AdminManager {
    constructor(appInstance) {
        this.app = appInstance;
    }

    // Show add employee modal
    showAddEmployeeForm() {
        const formHTML = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Add New Employee</h3>
                        <button class="modal-close" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="addEmployeeForm">
                            <div class="form-group">
                                <label>Name *</label>
                                <input type="text" id="empNameInput" required>
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="empEmailInput" required>
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" id="empPhoneInput">
                            </div>
                            <div class="form-group">
                                <label>Department *</label>
                                <select id="empDepartmentInput" required>
                                    <option value="">Select Department</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="HR">HR</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Position *</label>
                                <input type="text" id="empPositionInput" required>
                            </div>
                            <div class="form-group">
                                <label>Hire Date</label>
                                <input type="date" id="empHireDateInput">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = formHTML;
        
        document.getElementById('addEmployeeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addEmployee();
        });
    }

    async addEmployee() {
        try {
            const employeeData = {
                personalInfo: {
                    name: document.getElementById('empNameInput').value,
                    email: document.getElementById('empEmailInput').value,
                    phone: document.getElementById('empPhoneInput').value,
                    department: document.getElementById('empDepartmentInput').value,
                    position: document.getElementById('empPositionInput').value,
                    hireDate: document.getElementById('empHireDateInput').value
                },
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add employee to Firestore
            const docRef = await window.db.collection('employees').add(employeeData);

            // Create user account for the employee
            const password = 'TempPass123!'; // TODO: Generate secure password
            const registerResult = await window.authInstance.register(
                employeeData.personalInfo.email,
                password,
                'employee',
                docRef.id
            );

            if (registerResult.success) {
                // Log system action
                await window.authInstance.logSystemAction(
                    this.app.currentUser.uid,
                    'ADD_EMPLOYEE',
                    `Added employee: ${employeeData.personalInfo.name} (${docRef.id})`
                );

                alert('Employee added successfully! Temporary password: ' + password);
                closeModal();
                this.app.loadEmployeeManagement();
            } else {
                throw new Error(registerResult.error);
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Error adding employee: ' + error.message);
        }
    }

    async editEmployee(employeeId) {
        try {
            const employeeDoc = await window.db.collection('employees').doc(employeeId).get();
            if (!employeeDoc.exists) {
                alert('Employee not found');
                return;
            }

            const data = employeeDoc.data();
            const formHTML = `
                <div class="modal-overlay" onclick="closeModal()">
                    <div class="modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3>Edit Employee</h3>
                            <button class="modal-close" onclick="closeModal()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="editEmployeeForm">
                                <div class="form-group">
                                    <label>Name *</label>
                                    <input type="text" id="editEmpNameInput" value="${data.personalInfo?.name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>Email *</label>
                                    <input type="email" id="editEmpEmailInput" value="${data.personalInfo?.email || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>Phone</label>
                                    <input type="tel" id="editEmpPhoneInput" value="${data.personalInfo?.phone || ''}">
                                </div>
                                <div class="form-group">
                                    <label>Department *</label>
                                    <select id="editEmpDepartmentInput" required>
                                        <option value="Engineering" ${data.personalInfo?.department === 'Engineering' ? 'selected' : ''}>Engineering</option>
                                        <option value="HR" ${data.personalInfo?.department === 'HR' ? 'selected' : ''}>HR</option>
                                        <option value="Finance" ${data.personalInfo?.department === 'Finance' ? 'selected' : ''}>Finance</option>
                                        <option value="Sales" ${data.personalInfo?.department === 'Sales' ? 'selected' : ''}>Sales</option>
                                        <option value="Operations" ${data.personalInfo?.department === 'Operations' ? 'selected' : ''}>Operations</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Position *</label>
                                    <input type="text" id="editEmpPositionInput" value="${data.personalInfo?.position || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>Status</label>
                                    <select id="editEmpStatusInput">
                                        <option value="active" ${data.status === 'active' ? 'selected' : ''}>Active</option>
                                        <option value="inactive" ${data.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                    </select>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('modalContainer').innerHTML = formHTML;

            document.getElementById('editEmployeeForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveEmployeeChanges(employeeId);
            });
        } catch (error) {
            console.error('Error loading employee data:', error);
            alert('Error loading employee data');
        }
    }

    async saveEmployeeChanges(employeeId) {
        try {
            const updatedData = {
                personalInfo: {
                    name: document.getElementById('editEmpNameInput').value,
                    email: document.getElementById('editEmpEmailInput').value,
                    phone: document.getElementById('editEmpPhoneInput').value,
                    department: document.getElementById('editEmpDepartmentInput').value,
                    position: document.getElementById('editEmpPositionInput').value
                },
                status: document.getElementById('editEmpStatusInput').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.db.collection('employees').doc(employeeId).update(updatedData);

            await window.authInstance.logSystemAction(
                this.app.currentUser.uid,
                'UPDATE_EMPLOYEE',
                `Updated employee: ${employeeId}`
            );

            alert('Employee updated successfully!');
            closeModal();
            this.app.loadEmployeeManagement();
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Error updating employee: ' + error.message);
        }
    }

    async deleteEmployee(employeeId) {
        if (!confirm('Are you sure you want to delete this employee?')) {
            return;
        }

        try {
            await window.db.collection('employees').doc(employeeId).delete();

            await window.authInstance.logSystemAction(
                this.app.currentUser.uid,
                'DELETE_EMPLOYEE',
                `Deleted employee: ${employeeId}`
            );

            alert('Employee deleted successfully!');
            this.app.loadEmployeeManagement();
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error deleting employee: ' + error.message);
        }
    }

    async loadCompensationData() {
        try {
            const employeesSnapshot = await window.db.collection('employees').get();
            const compensationSnapshot = await window.db.collection('compensation').get();
            
            const compensationData = {};
            compensationSnapshot.forEach(doc => {
                compensationData[doc.id] = doc.data();
            });

            const compensationTable = document.getElementById('compensationTable');
            if (!compensationTable) return;

            compensationTable.innerHTML = '';

            employeesSnapshot.forEach(doc => {
                const emp = doc.data();
                const comp = compensationData[doc.id] || {};
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.personalInfo?.name || 'N/A'}</td>
                    <td>$${comp.baseSalary?.toFixed(2) || '0.00'}</td>
                    <td>$${comp.bonus?.toFixed(2) || '0.00'}</td>
                    <td>$${comp.allowances?.toFixed(2) || '0.00'}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="app.editCompensation('${doc.id}')">Edit</button>
                    </td>
                `;
                compensationTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading compensation data:', error);
        }
    }

    async showCompensationForm() {
        const employeesSnapshot = await window.db.collection('employees').get();
        
        let employeeOptions = '<option value="">Select Employee</option>';
        employeesSnapshot.forEach(doc => {
            const emp = doc.data();
            employeeOptions += `<option value="${doc.id}">${emp.personalInfo?.name || doc.id}</option>`;
        });

        const formHTML = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Set Employee Compensation</h3>
                        <button class="modal-close" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="compensationForm">
                            <div class="form-group">
                                <label>Employee *</label>
                                <select id="compEmployeeInput" required>
                                    ${employeeOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Base Salary *</label>
                                <input type="number" id="compBaseSalaryInput" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label>Bonus</label>
                                <input type="number" id="compBonusInput" step="0.01" value="0">
                            </div>
                            <div class="form-group">
                                <label>Allowances</label>
                                <input type="number" id="compAllowancesInput" step="0.01" value="0">
                            </div>
                            <div class="form-group">
                                <label>Tax Withholding %</label>
                                <input type="number" id="compTaxInput" step="0.1" value="20">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = formHTML;

        document.getElementById('compensationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCompensation();
        });
    }

    async saveCompensation() {
        try {
            const employeeId = document.getElementById('compEmployeeInput').value;
            
            const compensationData = {
                baseSalary: parseFloat(document.getElementById('compBaseSalaryInput').value),
                bonus: parseFloat(document.getElementById('compBonusInput').value) || 0,
                allowances: parseFloat(document.getElementById('compAllowancesInput').value) || 0,
                taxWithholding: parseFloat(document.getElementById('compTaxInput').value) || 20,
                benefits: {
                    healthInsurance: true,
                    retirementPercent: 5
                },
                payFrequency: 'monthly',
                effectiveDate: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.db.collection('compensation').doc(employeeId).set(compensationData, { merge: true });

            await window.authInstance.logSystemAction(
                this.app.currentUser.uid,
                'SET_COMPENSATION',
                `Set compensation for employee: ${employeeId}`
            );

            alert('Compensation saved successfully!');
            closeModal();
            this.loadCompensationData();
        } catch (error) {
            console.error('Error saving compensation:', error);
            alert('Error saving compensation: ' + error.message);
        }
    }

    async initiatePayroll() {
        const formHTML = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Initiate Payroll Run</h3>
                        <button class="modal-close" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="payrollForm">
                            <div class="form-group">
                                <label>Pay Period Start *</label>
                                <input type="date" id="payrollStartInput" required>
                            </div>
                            <div class="form-group">
                                <label>Pay Period End *</label>
                                <input type="date" id="payrollEndInput" required>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Process Payroll</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = formHTML;

        document.getElementById('payrollForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processPayroll();
        });
    }

    async processPayroll() {
        try {
            const startDate = document.getElementById('payrollStartInput').value;
            const endDate = document.getElementById('payrollEndInput').value;

            // Get all active employees
            const employeesSnapshot = await window.db.collection('employees')
                .where('status', '==', 'active')
                .get();

            const employeeIds = [];
            employeesSnapshot.forEach(doc => {
                employeeIds.push(doc.id);
            });

            // Create payroll run document
            const payrollRunData = {
                payPeriod: startDate + ' to ' + endDate,
                runDate: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'completed',
                processedBy: this.app.currentUser.uid,
                totalAmount: 0,
                employees: employeeIds
            };

            const payrollRunRef = await window.db.collection('payrollRuns').add(payrollRunData);

            // Process each employee's payroll
            let totalPayroll = 0;
            for (const employeeId of employeeIds) {
                const payrollData = await this.calculateEmployeePayroll(employeeId, startDate, endDate);
                
                await window.db.collection('payrollItems').add({
                    payrollRunId: payrollRunRef.id,
                    employeeId: employeeId,
                    ...payrollData,
                    paymentStatus: 'processed'
                });

                totalPayroll += payrollData.netPay;
            }

            // Update total amount in payroll run
            await window.db.collection('payrollRuns').doc(payrollRunRef.id).update({
                totalAmount: totalPayroll
            });

            await window.authInstance.logSystemAction(
                this.app.currentUser.uid,
                'PROCESS_PAYROLL',
                `Processed payroll run: ${payrollRunRef.id}`
            );

            alert('Payroll processed successfully! Total amount: $' + totalPayroll.toFixed(2));
            closeModal();
            this.app.loadPayrollProcessing();
        } catch (error) {
            console.error('Error processing payroll:', error);
            alert('Error processing payroll: ' + error.message);
        }
    }

    async calculateEmployeePayroll(employeeId, startDate, endDate) {
        try {
            const compensationDoc = await window.db.collection('compensation').doc(employeeId).get();
            
            if (!compensationDoc.exists) {
                return {
                    grossPay: 0,
                    deductions: 0,
                    netPay: 0
                };
            }

            const comp = compensationDoc.data();
            const grossPay = comp.baseSalary + (comp.bonus || 0) + (comp.allowances || 0);
            const taxAmount = grossPay * ((comp.taxWithholding || 20) / 100);
            const netPay = grossPay - taxAmount;

            return {
                grossPay: grossPay,
                deductions: taxAmount,
                netPay: netPay
            };
        } catch (error) {
            console.error('Error calculating payroll:', error);
            return {
                grossPay: 0,
                deductions: 0,
                netPay: 0
            };
        }
    }
}

// Global modal functions
function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

// Export AdminManager class for use in app.js
window.AdminManager = AdminManager;

