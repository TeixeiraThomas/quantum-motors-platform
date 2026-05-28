import Header from "@/components/global/Header/Header";
import HeadCustom from "@/components/global/Head/Head";
import { getApiBaseUrl } from "@/lib/api";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  FormEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BusinessFleetVehicle,
  CrmLead,
  MaintenanceAppointment,
  PlatformData,
  SavedConfiguration,
  VehicleOrder,
} from "types/platformTypes";
import styles from "./Platform.module.scss";

type PlatformSection =
  | "configurations"
  | "orders"
  | "fleet"
  | "maintenance"
  | "crm";

type ApiResponse<T> = {
  value: T;
};

const emptyData: PlatformData = {
  summary: null,
  configurations: [],
  orders: [],
  fleet: [],
  maintenance: [],
  crmLeads: [],
};

const sectionLabels: Record<PlatformSection, string> = {
  configurations: "Configurations",
  orders: "Commandes",
  fleet: "Flottes B2B",
  maintenance: "Entretiens",
  crm: "CRM",
};

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} failed`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.value;
}

async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `POST ${path} failed`);
  }

  return payload.value;
}

function formObject(form: HTMLFormElement): Record<string, unknown> {
  const entries = Array.from(new FormData(form).entries());

  return entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (typeof value === "string" && value.trim().length > 0) {
      acc[key] = value.trim();
    }

    return acc;
  }, {});
}

function formatPrice(price?: number | null): string {
  if (!price) {
    return "Prix a confirmer";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(value?: string): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PlatformPage() {
  const [activeSection, setActiveSection] =
    useState<PlatformSection>("configurations");
  const [data, setData] = useState<PlatformData>(emptyData);
  const [status, setStatus] = useState("Chargement de la plateforme...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [
      summary,
      configurations,
      orders,
      fleet,
      maintenance,
      crmLeads,
    ] = await Promise.all([
      apiGet<PlatformData["summary"]>("/platform/summary"),
      apiGet<SavedConfiguration[]>("/platform/configurations"),
      apiGet<VehicleOrder[]>("/platform/orders"),
      apiGet<BusinessFleetVehicle[]>("/platform/fleet"),
      apiGet<MaintenanceAppointment[]>("/platform/maintenance"),
      apiGet<CrmLead[]>("/platform/crm-leads"),
    ]);

    setData({
      summary,
      configurations,
      orders,
      fleet,
      maintenance,
      crmLeads,
    });
    setStatus("Plateforme synchronisee avec l API");
  }, []);

  useEffect(() => {
    loadData().catch((error: Error) => {
      setStatus(`API indisponible: ${error.message}`);
    });
  }, [loadData]);

  const handleSubmit = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
      path: string,
      normalize?: (payload: Record<string, unknown>) => Record<string, unknown>
    ) => {
      event.preventDefault();
      setIsSubmitting(true);
      setStatus("Enregistrement en cours...");

      const form = event.currentTarget;
      const payload = normalize ? normalize(formObject(form)) : formObject(form);

      try {
        await apiPost(path, payload);
        form.reset();
        await loadData();
        setStatus("Enregistrement effectue");
      } catch (error) {
        const err = error as Error;
        setStatus(`Erreur: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadData]
  );

  const kpis = useMemo(
    () => [
      ["Configurations", data.summary?.savedConfigurations || 0],
      ["Commandes", data.summary?.orders || 0],
      ["Vehicules B2B", data.summary?.fleetVehicles || 0],
      ["Entretiens prevus", data.summary?.upcomingMaintenance || 0],
      ["Demandes CRM", data.summary?.crmLeads || 0],
    ],
    [data.summary]
  );

  return (
    <main className={styles.platform}>
      <Header colorMode="white" />
      <div className={styles.platform__inner}>
        <section className={styles.platform__header}>
          <div>
            <p className={styles.platform__eyebrow}>Quantum Motors</p>
            <h1 className={styles.platform__title}>Plateforme commerciale</h1>
            <p className={styles.platform__intro}>
              Commandes, configurations client, flottes entreprise, entretiens
              et relais CRM sont maintenant centralises.
            </p>
          </div>
          <div className={styles.platform__status}>{status}</div>
        </section>

        <section className={styles.kpis}>
          {kpis.map(([label, value]) => (
            <article className={styles.kpi} key={label}>
              <span className={styles.kpi__value}>{value}</span>
              <span className={styles.kpi__label}>{label}</span>
            </article>
          ))}
        </section>

        <section className={styles.workspace}>
          <article className={styles.panel}>
            <div className={styles.panel__header}>
              <h2 className={styles.panel__title}>Nouvelle operation</h2>
            </div>
            <div className={styles.panel__body}>
              <nav className={styles.tabs} aria-label="Sections plateforme">
                {(Object.keys(sectionLabels) as PlatformSection[]).map(
                  (section) => (
                    <button
                      className={styles.tab}
                      data-active={activeSection === section}
                      key={section}
                      onClick={() => setActiveSection(section)}
                      type="button"
                    >
                      {sectionLabels[section]}
                    </button>
                  )
                )}
              </nav>

              {activeSection === "configurations" && (
                <form
                  className={styles.form}
                  onSubmit={(event) =>
                    handleSubmit(event, "/platform/configurations")
                  }
                >
                  <div className={styles.form__grid}>
                    <label>
                      Client
                      <input name="customerName" required />
                    </label>
                    <label>
                      Email
                      <input name="customerEmail" required type="email" />
                    </label>
                    <label>
                      Pays
                      <input defaultValue="France" name="country" />
                    </label>
                    <label>
                      Langue
                      <input defaultValue="fr-FR" name="locale" />
                    </label>
                    <label>
                      Modele
                      <input name="modelName" required />
                    </label>
                    <label>
                      Finition
                      <input name="finishName" />
                    </label>
                    <label>
                      Batterie
                      <input name="batteryName" />
                    </label>
                    <label>
                      Couleur
                      <input name="colorName" />
                    </label>
                    <label>
                      Prix
                      <input min="0" name="totalPrice" step="1" type="number" />
                    </label>
                  </div>
                  <label>
                    Notes
                    <textarea name="notes" />
                  </label>
                  <button className={styles.button} disabled={isSubmitting}>
                    Sauvegarder la configuration
                  </button>
                </form>
              )}

              {activeSection === "orders" && (
                <form
                  className={styles.form}
                  onSubmit={(event) => handleSubmit(event, "/platform/orders")}
                >
                  <div className={styles.form__grid}>
                    <label>
                      Client
                      <input name="customerName" required />
                    </label>
                    <label>
                      Email
                      <input name="customerEmail" required type="email" />
                    </label>
                    <label>
                      Telephone
                      <input name="customerPhone" />
                    </label>
                    <label>
                      Pays
                      <input defaultValue="France" name="country" />
                    </label>
                    <label>
                      Point de vente
                      <input name="pointOfSale" required />
                    </label>
                    <label>
                      Vehicule
                      <input name="vehicleModel" required />
                    </label>
                    <label>
                      Prix
                      <input min="0" name="totalPrice" step="1" type="number" />
                    </label>
                    <label>
                      Configuration sauvegardee
                      <select name="configurationId">
                        <option value="">Aucune</option>
                        {data.configurations.map((configuration) => (
                          <option key={configuration.id} value={configuration.id}>
                            #{configuration.id} - {configuration.modelName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button className={styles.button} disabled={isSubmitting}>
                    Creer la commande
                  </button>
                </form>
              )}

              {activeSection === "fleet" && (
                <form
                  className={styles.form}
                  onSubmit={(event) => handleSubmit(event, "/platform/fleet")}
                >
                  <div className={styles.form__grid}>
                    <label>
                      Entreprise
                      <input name="companyName" required />
                    </label>
                    <label>
                      Contact
                      <input name="contactName" required />
                    </label>
                    <label>
                      Email contact
                      <input name="contactEmail" required type="email" />
                    </label>
                    <label>
                      Pays
                      <input defaultValue="France" name="country" />
                    </label>
                    <label>
                      Vehicule
                      <input name="vehicleLabel" required />
                    </label>
                    <label>
                      VIN
                      <input name="vin" />
                    </label>
                    <label>
                      Immatriculation
                      <input name="licensePlate" />
                    </label>
                  </div>
                  <button className={styles.button} disabled={isSubmitting}>
                    Ajouter a la flotte
                  </button>
                </form>
              )}

              {activeSection === "maintenance" && (
                <form
                  className={styles.form}
                  onSubmit={(event) =>
                    handleSubmit(event, "/platform/maintenance", (payload) => {
                      if (typeof payload.appointmentDate === "string") {
                        payload.appointmentDate = new Date(
                          payload.appointmentDate
                        ).toISOString();
                      }

                      return payload;
                    })
                  }
                >
                  <div className={styles.form__grid}>
                    <label>
                      Client
                      <input name="customerName" />
                    </label>
                    <label>
                      Email
                      <input name="customerEmail" required type="email" />
                    </label>
                    <label>
                      Vehicule
                      <input name="vehicleLabel" required />
                    </label>
                    <label>
                      Centre de service
                      <input name="serviceCenter" required />
                    </label>
                    <label>
                      Date
                      <input name="appointmentDate" required type="datetime-local" />
                    </label>
                    <label>
                      Type
                      <select name="serviceType">
                        <option value="REVISION">Revision</option>
                        <option value="REPAIR">Reparation</option>
                        <option value="TIRE_CHANGE">Pneus</option>
                        <option value="SOFTWARE_UPDATE">Mise a jour</option>
                      </select>
                    </label>
                    <label>
                      Vehicule flotte
                      <select name="fleetVehicleId">
                        <option value="">Aucun</option>
                        {data.fleet.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            #{vehicle.id} - {vehicle.vehicleLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Notes
                    <textarea name="notes" />
                  </label>
                  <button className={styles.button} disabled={isSubmitting}>
                    Planifier l entretien
                  </button>
                </form>
              )}

              {activeSection === "crm" && (
                <form
                  className={styles.form}
                  onSubmit={(event) =>
                    handleSubmit(event, "/platform/crm-leads")
                  }
                >
                  <div className={styles.form__grid}>
                    <label>
                      Nom
                      <input name="fullName" required />
                    </label>
                    <label>
                      Email
                      <input name="email" required type="email" />
                    </label>
                    <label>
                      Telephone
                      <input name="phone" />
                    </label>
                    <label>
                      Entreprise
                      <input name="company" />
                    </label>
                    <label>
                      Sujet
                      <input name="topic" required />
                    </label>
                    <label>
                      Vehicule interesse
                      <input name="vehicleInterest" />
                    </label>
                    <label>
                      Source
                      <select name="source">
                        <option value="CONTACT_FORM">Formulaire</option>
                        <option value="ORDER">Commande</option>
                        <option value="TEST_DRIVE">Essai</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Message
                    <textarea name="message" required />
                  </label>
                  <button className={styles.button} disabled={isSubmitting}>
                    Envoyer vers le CRM
                  </button>
                </form>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panel__header}>
              <h2 className={styles.panel__title}>Activite recente</h2>
            </div>
            <div className={`${styles.panel__body} ${styles.lists}`}>
              {activeSection === "configurations" &&
                renderConfigurations(data.configurations)}
              {activeSection === "orders" && renderOrders(data.orders)}
              {activeSection === "fleet" && renderFleet(data.fleet)}
              {activeSection === "maintenance" &&
                renderMaintenance(data.maintenance)}
              {activeSection === "crm" && renderCrmLeads(data.crmLeads)}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function renderConfigurations(configurations: SavedConfiguration[]) {
  if (configurations.length === 0) {
    return <p className={styles.empty}>Aucune configuration sauvegardee.</p>;
  }

  return configurations.slice(0, 8).map((configuration) => (
    <article className={styles.record} key={configuration.id}>
      <div className={styles.record__top}>
        <div>
          <p className={styles.record__title}>
            {configuration.customerName} - {configuration.modelName}
          </p>
          <p className={styles.record__meta}>
            {configuration.customerEmail} · {configuration.country} ·{" "}
            {formatPrice(configuration.totalPrice)}
          </p>
        </div>
        <span className={styles.record__tag}>#{configuration.id}</span>
      </div>
    </article>
  ));
}

function renderOrders(orders: VehicleOrder[]) {
  if (orders.length === 0) {
    return <p className={styles.empty}>Aucune commande creee.</p>;
  }

  return orders.slice(0, 8).map((order) => (
    <article className={styles.record} key={order.id}>
      <div className={styles.record__top}>
        <div>
          <p className={styles.record__title}>
            {order.reference} - {order.vehicleModel}
          </p>
          <p className={styles.record__meta}>
            {order.customerName} · {order.pointOfSale} ·{" "}
            {formatPrice(order.totalPrice)}
          </p>
        </div>
        <span className={styles.record__tag}>{order.status}</span>
      </div>
    </article>
  ));
}

function renderFleet(fleet: BusinessFleetVehicle[]) {
  if (fleet.length === 0) {
    return <p className={styles.empty}>Aucun vehicule entreprise.</p>;
  }

  return fleet.slice(0, 8).map((vehicle) => (
    <article className={styles.record} key={vehicle.id}>
      <div className={styles.record__top}>
        <div>
          <p className={styles.record__title}>
            {vehicle.companyName} - {vehicle.vehicleLabel}
          </p>
          <p className={styles.record__meta}>
            {vehicle.contactEmail} · {vehicle.country}
          </p>
        </div>
        <span className={styles.record__tag}>{vehicle.status}</span>
      </div>
    </article>
  ));
}

function renderMaintenance(appointments: MaintenanceAppointment[]) {
  if (appointments.length === 0) {
    return <p className={styles.empty}>Aucun entretien planifie.</p>;
  }

  return appointments.slice(0, 8).map((appointment) => (
    <article className={styles.record} key={appointment.id}>
      <div className={styles.record__top}>
        <div>
          <p className={styles.record__title}>
            {appointment.vehicleLabel} - {appointment.serviceCenter}
          </p>
          <p className={styles.record__meta}>
            {appointment.customerEmail} · {formatDate(appointment.appointmentDate)}
          </p>
        </div>
        <span className={styles.record__tag}>{appointment.status}</span>
      </div>
    </article>
  ));
}

function renderCrmLeads(leads: CrmLead[]) {
  if (leads.length === 0) {
    return <p className={styles.empty}>Aucune demande CRM.</p>;
  }

  return leads.slice(0, 8).map((lead) => (
    <article className={styles.record} key={lead.id}>
      <div className={styles.record__top}>
        <div>
          <p className={styles.record__title}>
            {lead.fullName} - {lead.topic}
          </p>
          <p className={styles.record__meta}>
            {lead.email} · {lead.vehicleInterest || "Vehicule a qualifier"}
          </p>
        </div>
        <span className={styles.record__tag}>{lead.status}</span>
      </div>
    </article>
  ));
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale as string, ["common"])),
    },
  };
};

PlatformPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <>
      <HeadCustom />
      {page}
    </>
  );
};

export default PlatformPage;
