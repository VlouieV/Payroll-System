// Main Application Logic
class PayrollApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!window.auth) {
            console.error('Firebase auth not initialized');
            return;
        }
        window.auth.onAuthStateChanged(async user => {
            if (user) {
                await this.loadUserData(user.uid);
                this.initializeApp();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    async loadUserData(uid) {
        if (!window.db || !window.auth) return;
        try {
            const userDoc = await window.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = {
                    uid: uid,
                    email: window.auth.currentUser.email,
                    role: userData.role,
                    employeeId: userData.employeeId
                };
                
                // Load additional data based on role
                if (this.currentUser.role === 'employee' && this.currentUser.employeeId) {
                    await this.loadEmployeeData(this.currentUser.employeeId);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadEmployeeData(employeeId) {
        if (!window.db) return;
        try {
            const employeeDoc = await window.db.collection('employees').doc(employeeId).get();
            if (employeeDoc.exists) {
                this.currentUser.employeeData = employeeDoc.data();
            }
        } catch (error) {
            console.error('Error loading employee data:', error);
        }
    }

    initializeApp() {
        this.setupNavigation();
        this.setupDashboard();
        
        // Setup role-based UI
        if (this.currentUser.role === 'admin') {
            this.setupAdminUI();
        } else {
            this.setupEmployeeUI();
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });
    }

    showSection(sectionId) {
        if (!sectionId) return;
        
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        if (!sections || sections.length === 0) return;
        
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'adminDashboard':
                this.loadAdminDashboard();
                break;
            case 'employeeDashboard':
                this.loadEmployeeDashboard();
                break;
            case 'employeeManagement':
                this.loadEmployeeManagement();
                break;
            case 'compensationManagement':
                this.loadCompensationManagement();
                break;
            case 'payrollProcessing':
                this.loadPayrollProcessing();
                break;
            case 'leaveReport':
                this.loadLeaveReport();
                break;
            case 'salaryReport':
                this.loadSalaryReport();
                break;
        }
    }

    setupDashboard() {
        document.getElementById('userName').textContent = this.currentUser.email;
    }

    setupAdminUI() {
        // Show admin sections
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'block';
        });
    }

    setupEmployeeUI() {
        // Hide admin sections
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'none';
        });
    }

    async loadAdminDashboard() {
        try {
            const stats = await this.getAdminStats();
            document.getElementById('totalEmployees').textContent = stats.totalEmployees;
            document.getElementById('pendingPayroll').textContent = stats.pendingPayroll;
            document.getElementById('activeEmployees').textContent = stats.activeEmployees;
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
        }
    }

    async loadEmployeeDashboard() {
        if (!this.currentUser.employeeId) return;

        try {
            const employeeDoc = await window.db.collection('employees').doc(this.currentUser.employeeId).get();
            if (employeeDoc.exists) {
                const data = employeeDoc.data();
                if (data.personalInfo) {
                    document.getElementById('empName').textContent = data.personalInfo.name || 'N/A';
                    document.getElementById('empDepartment').textContent = data.personalInfo.department || 'N/A';
                    document.getElementById('empPosition').textContent = data.personalInfo.position || 'N/A';
                }
            }
        } catch (error) {
            console.error('Error loading employee dashboard:', error);
        }
    }

    async getAdminStats() {
        if (!window.db) return { totalEmployees: 0, activeEmployees: 0, pendingPayroll: 0 };
        try {
            const employeesSnapshot = await window.db.collection('employees').get();
            const payrollSnapshot = await window.db.collection('payrollRuns')
                .where('status', '==', 'pending')
                .get();

            return {
                totalEmployees: employeesSnapshot.size,
                activeEmployees: employeesSnapshot.size, // TODO: filter by status
                pendingPayroll: payrollSnapshot.size
            };
        } catch (error) {
            console.error('Error getting admin stats:', error);
            return { totalEmployees: 0, activeEmployees: 0, pendingPayroll: 0 };
        }
    }

    async loadLeaveReport() {
        if (!this.currentUser.employeeId) return;

        try {
            const leaveSnapshot = await window.db.collection('leaveRecords')
                .where('employeeId', '==', this.currentUser.employeeId)
                .orderBy('startDate', 'desc')
                .get();

            const leaveTable = document.getElementById('leaveTable');
            if (!leaveTable) return;

            leaveTable.innerHTML = '';
            
            leaveSnapshot.forEach(doc => {
                const leave = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${leave.leaveType || 'N/A'}</td>
                    <td>${formatDate(leave.startDate)}</td>
                    <td>${formatDate(leave.endDate)}</td>
                    <td><span class="badge badge-${leave.status}">${leave.status}</span></td>
                `;
                leaveTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading leave report:', error);
        }
    }

    async loadSalaryReport() {
        if (!this.currentUser.employeeId) return;

        try {
            const compensationDoc = await window.db.collection('compensation')
                .doc(this.currentUser.employeeId)
                .get();

            if (compensationDoc.exists) {
                const comp = compensationDoc.data();
                document.getElementById('currentSalary').textContent = '$' + (comp.baseSalary || 0).toFixed(2);
            }
        } catch (error) {
            console.error('Error loading salary report:', error);
        }
    }

    async loadEmployeeManagement() {
        try {
            const employeesSnapshot = await window.db.collection('employees').get();
            const employeeTable = document.getElementById('employeeTable');
            if (!employeeTable) return;

            employeeTable.innerHTML = '';
            
            employeesSnapshot.forEach(doc => {
                const emp = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${doc.id}</td>
                    <td>${emp.personalInfo?.name || 'N/A'}</td>
                    <td>${emp.personalInfo?.email || 'N/A'}</td>
                    <td>${emp.personalInfo?.department || 'N/A'}</td>
                    <td><span class="badge badge-${emp.status}">${emp.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="app.editEmployee('${doc.id}')">Edit</button>
                        <button class="btn btn-sm btn-delete" onclick="app.deleteEmployee('${doc.id}')">Delete</button>
                    </td>
                `;
                employeeTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading employee management:', error);
        }
    }

    async loadCompensationManagement() {
        // TODO: Implement compensation management loading
        console.log('Loading compensation management...');
    }

    async loadPayrollProcessing() {
        try {
            const payrollSnapshot = await window.db.collection('payrollRuns')
                .orderBy('runDate', 'desc')
                .limit(10)
                .get();

            const payrollTable = document.getElementById('payrollTable');
            if (!payrollTable) return;

            payrollTable.innerHTML = '';
            
            payrollSnapshot.forEach(doc => {
                const payroll = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payroll.payPeriod || 'N/A'}</td>
                    <td>${formatDate(payroll.runDate)}</td>
                    <td><span class="badge badge-${payroll.status}">${payroll.status}</span></td>
                    <td>$${payroll.totalAmount?.toFixed(2) || '0.00'}</td>
                    <td>
                        <button class="btn btn-sm btn-process" onclick="app.processPayroll('${doc.id}')">Process</button>
                    </td>
                `;
                payrollTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading payroll processing:', error);
        }
    }

    async logout() {
        if (!window.authInstance) {
            console.error('Auth instance not available');
            return;
        }
        if (confirm('Are you sure you want to logout?')) {
            await window.authInstance.logout();
            window.location.href = 'login.html';
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showMessage('passwordMessage', 'Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('passwordMessage', 'New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('passwordMessage', 'Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const result = await window.authInstance.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                this.showMessage('passwordMessage', 'Password changed successfully!', 'success');
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                this.showMessage('passwordMessage', result.error, 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showMessage('passwordMessage', 'Error changing password', 'error');
        }
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = message;
        element.className = `message ${type}`;
        
        setTimeout(() => {
            element.className = 'message';
            element.textContent = '';
        }, 5000);
    }

    async applyLeave() {
        if (!this.currentUser.employeeId) {
            alert('Employee ID not found');
            return;
        }

        const leaveType = document.getElementById('leaveType').value;
        const startDate = document.getElementById('leaveStartDate').value;
        const endDate = document.getElementById('leaveEndDate').value;
        const reason = document.getElementById('leaveReason').value;

        if (!leaveType || !startDate || !endDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date must be before end date');
            return;
        }

        try {
            await window.db.collection('leaveRecords').add({
                employeeId: this.currentUser.employeeId,
                leaveType: leaveType,
                startDate: startDate,
                endDate: endDate,
                reason: reason,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.authInstance.logSystemAction(
                this.currentUser.uid,
                'APPLY_LEAVE',
                `Applied for ${leaveType} leave`
            );

            alert('Leave application submitted successfully!');
            
            // Reset form
            document.getElementById('leaveType').value = '';
            document.getElementById('leaveStartDate').value = '';
            document.getElementById('leaveEndDate').value = '';
            document.getElementById('leaveReason').value = '';
        } catch (error) {
            console.error('Error applying for leave:', error);
            alert('Error submitting leave application');
        }
    }

    async loadLeaveHistory() {
        const historyDiv = document.getElementById('leaveHistory');
        if (historyDiv.style.display === 'none') {
            historyDiv.style.display = 'block';
            await this.loadLeaveReport();
        } else {
            historyDiv.style.display = 'none';
        }
    }
}

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
}

// Initialize app
let app;
window.app = null; // Initialize early to prevent errors

// Wait for scripts to load
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is properly configured
    if (typeof firebase === 'undefined' || !window.auth || !window.db) {
        console.error('Firebase not initialized. Please configure firebase-config.js');
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif;">
                <div style="text-align: center; padding: 40px; border: 2px solid #e74c3c; border-radius: 10px;">
                    <h2 style="color: #e74c3c;">Firebase Configuration Required</h2>
                    <p>Please configure your Firebase credentials in <strong>firebase-config.js</strong></p>
                    <p>See SETUP.md for instructions.</p>
                </div>
            </div>
        `;
        return;
    }

    // Initialize app immediately
    try {
        app = new PayrollApp();
        window.app = app;

        // Initialize admin manager after app is loaded
        if (window.AdminManager) {
            window.app.adminManager = new window.AdminManager(window.app);
            setupAdminMethods();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

function setupAdminMethods() {
    if (!window.app || !window.app.adminManager) return;
    
    window.app.showAddEmployeeForm = () => window.app.adminManager.showAddEmployeeForm();
    window.app.editEmployee = (id) => window.app.adminManager.editEmployee(id);
    window.app.deleteEmployee = (id) => window.app.adminManager.deleteEmployee(id);
    window.app.loadCompensationData = () => window.app.adminManager.loadCompensationData();
    window.app.showCompensationForm = () => window.app.adminManager.showCompensationForm();
    window.app.initiatePayroll = () => window.app.adminManager.initiatePayroll();
    window.app.processPayroll = (id) => {
        if (id) {
            alert('Processing individual payroll: ' + id);
        } else {
            window.app.adminManager.initiatePayroll();
        }
    };
    window.app.loadCompensationManagement = () => window.app.adminManager.loadCompensationData();
}

